/**
 * Drawings are stored and sent as strokes, not pixels: small to send, crisp at any size,
 * and easy to stream point by point for live drawing games. The client renders them with
 * the pencil brush (apps/client/src/drawing).
 */

export type DrawingTool = 'pencil' | 'eraser' | 'fill';

/** A line drawn with the pencil or the eraser. */
export interface PathStroke {
  tool: 'pencil' | 'eraser';
  /** #rrggbb. Ignored by the eraser. */
  color: string;
  /** Brush diameter in drawing units. */
  size: number;
  /** How dark the pencil is, MIN_STROKE_OPACITY to 1. Missing means STROKE_OPACITY_FALLBACK. Ignored by the eraser. */
  opacity?: number;
  /** Flat list of x, y pairs in drawing units: [x0, y0, x1, y1, ...]. */
  points: number[];
}

/**
 * A bucket fill. The filled area is worked out once, where the player clicked, and stored as
 * horizontal spans, so it looks the same on every screen without re-running the fill.
 */
export interface FillStroke {
  tool: 'fill';
  color: string;
  opacity?: number;
  /** Height of one span row in drawing units (one of FILL_ROW_HEIGHTS). */
  rowHeight: number;
  /** Flat list of rows: [y, x0, x1, ...] in drawing units, each covering x0 ≤ x < x1 from y to y + rowHeight. */
  spans: number[];
}

export type Stroke = PathStroke | FillStroke;

export interface Drawing {
  width: number;
  height: number;
  strokes: Stroke[];
}

/** Player characters are drawn on a square canvas of this size. */
export const AVATAR_SIZE = 256;

export const BRUSH_SIZES = [3, 6, 12, 22] as const;
export const MAX_BRUSH_SIZE = 64;

export const MIN_STROKE_OPACITY = 0.1;
/** Opacity for strokes saved before opacity existed. */
export const STROKE_OPACITY_FALLBACK = 0.6;

export const FILL_ROW_HEIGHTS = [0.5, 1] as const;

export interface DrawingLimits {
  width: number;
  height: number;
  maxStrokes: number;
  /** Total number of x, y pairs plus fill spans across all strokes. */
  maxPoints: number;
}

export const AVATAR_LIMITS: DrawingLimits = { width: AVATAR_SIZE, height: AVATAR_SIZE, maxStrokes: 600, maxPoints: 24_000 };

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function emptyDrawing(width = AVATAR_SIZE, height = AVATAR_SIZE): Drawing {
  return { width, height, strokes: [] };
}

/** How much a stroke counts towards DrawingLimits.maxPoints. */
export function strokeCost(stroke: Stroke): number {
  return stroke.tool === 'fill' ? stroke.spans.length / 3 : stroke.points.length / 2;
}

/** Returns a clean opacity, undefined when absent, or null when invalid. */
function cleanOpacity(raw: unknown): number | undefined | null {
  if (raw === undefined) return undefined;
  const opacity = Number(raw);
  if (!Number.isFinite(opacity) || opacity < MIN_STROKE_OPACITY || opacity > 1) return null;
  return Math.round(opacity * 100) / 100;
}

function sanitizeFill(s: Partial<FillStroke>, color: string, width: number, height: number): FillStroke | null {
  const opacity = cleanOpacity(s.opacity);
  if (opacity === null) return null;
  const rowHeight = Number(s.rowHeight);
  if (!(FILL_ROW_HEIGHTS as readonly number[]).includes(rowHeight)) return null;
  if (!Array.isArray(s.spans) || s.spans.length < 3 || s.spans.length % 3 !== 0) return null;

  const spans: number[] = [];
  for (let i = 0; i < s.spans.length; i += 3) {
    const [y, x0, x1] = [Number(s.spans[i]), Number(s.spans[i + 1]), Number(s.spans[i + 2])];
    if (![y, x0, x1].every(Number.isFinite)) return null;
    if (y < 0 || y >= height || x0 < 0 || x1 > width || x1 <= x0) return null;
    // Snap to the fill grid so stored values stay small and predictable.
    const snap = (n: number) => Math.round(n / rowHeight) * rowHeight;
    spans.push(snap(y), snap(x0), snap(x1));
  }
  const fill: FillStroke = { tool: 'fill', color, rowHeight, spans };
  if (opacity !== undefined) fill.opacity = opacity;
  return fill;
}

/** Checks one stroke from an untrusted source and returns a clean copy, or null if it's unusable. */
export function sanitizeStroke(raw: unknown, width: number, height: number): Stroke | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Partial<PathStroke> & Partial<FillStroke>;
  const color = typeof s.color === 'string' && HEX_COLOR.test(s.color) ? s.color.toLowerCase() : null;
  if (!color) return null;
  if (s.tool === 'fill') return sanitizeFill(s, color, width, height);
  if (s.tool !== 'pencil' && s.tool !== 'eraser') return null;

  const size = Number(s.size);
  if (!Number.isFinite(size) || size < 1 || size > MAX_BRUSH_SIZE) return null;
  if (!Array.isArray(s.points) || s.points.length < 2 || s.points.length % 2 !== 0) return null;
  const opacity = cleanOpacity(s.opacity);
  if (opacity === null) return null;

  const margin = MAX_BRUSH_SIZE;
  const points: number[] = [];
  for (let i = 0; i < s.points.length; i += 2) {
    const x = Number(s.points[i]);
    const y = Number(s.points[i + 1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (x < -margin || y < -margin || x > width + margin || y > height + margin) return null;
    points.push(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  }
  const stroke: PathStroke = { tool: s.tool, color, size, points };
  if (opacity !== undefined) stroke.opacity = opacity;
  return stroke;
}

/**
 * Checks a whole drawing from an untrusted source (a player's browser). Returns a clean copy
 * or null. Use this on the server before storing or forwarding any drawing.
 */
export function sanitizeDrawing(raw: unknown, limits: DrawingLimits): Drawing | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const d = raw as Partial<Drawing>;
  if (d.width !== limits.width || d.height !== limits.height) return null;
  if (!Array.isArray(d.strokes) || d.strokes.length > limits.maxStrokes) return null;

  const strokes: Stroke[] = [];
  let total = 0;
  for (const rawStroke of d.strokes) {
    const stroke = sanitizeStroke(rawStroke, limits.width, limits.height);
    if (!stroke) return null;
    total += strokeCost(stroke);
    if (total > limits.maxPoints) return null;
    strokes.push(stroke);
  }
  return { width: limits.width, height: limits.height, strokes };
}

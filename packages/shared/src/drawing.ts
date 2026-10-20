/**
 * Drawings are stored and sent as strokes, not pixels: small to send, crisp at any size,
 * and easy to stream point by point for live drawing games. The client renders them with
 * the pencil brush (apps/client/src/drawing).
 */

export type DrawingTool = 'pencil' | 'eraser';

export interface Stroke {
  tool: DrawingTool;
  /** #rrggbb. Ignored by the eraser. */
  color: string;
  /** Brush diameter in drawing units. */
  size: number;
  /** Flat list of x, y pairs in drawing units: [x0, y0, x1, y1, ...]. */
  points: number[];
}

export interface Drawing {
  width: number;
  height: number;
  strokes: Stroke[];
}

/** Player characters are drawn on a square canvas of this size. */
export const AVATAR_SIZE = 256;

export const BRUSH_SIZES = [3, 6, 12, 22] as const;
export const MAX_BRUSH_SIZE = 64;

export interface DrawingLimits {
  width: number;
  height: number;
  maxStrokes: number;
  /** Total number of x, y pairs across all strokes. */
  maxPoints: number;
}

export const AVATAR_LIMITS: DrawingLimits = { width: AVATAR_SIZE, height: AVATAR_SIZE, maxStrokes: 600, maxPoints: 24_000 };

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function emptyDrawing(width = AVATAR_SIZE, height = AVATAR_SIZE): Drawing {
  return { width, height, strokes: [] };
}

/** Checks one stroke from an untrusted source and returns a clean copy, or null if it's unusable. */
export function sanitizeStroke(raw: unknown, width: number, height: number): Stroke | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Partial<Stroke>;
  if (s.tool !== 'pencil' && s.tool !== 'eraser') return null;
  const color = typeof s.color === 'string' && HEX_COLOR.test(s.color) ? s.color.toLowerCase() : null;
  if (!color) return null;
  const size = Number(s.size);
  if (!Number.isFinite(size) || size < 1 || size > MAX_BRUSH_SIZE) return null;
  if (!Array.isArray(s.points) || s.points.length < 2 || s.points.length % 2 !== 0) return null;

  const margin = MAX_BRUSH_SIZE;
  const points: number[] = [];
  for (let i = 0; i < s.points.length; i += 2) {
    const x = Number(s.points[i]);
    const y = Number(s.points[i + 1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (x < -margin || y < -margin || x > width + margin || y > height + margin) return null;
    points.push(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  }
  return { tool: s.tool, color, size, points };
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
    total += stroke.points.length / 2;
    if (total > limits.maxPoints) return null;
    strokes.push(stroke);
  }
  return { width: limits.width, height: limits.height, strokes };
}

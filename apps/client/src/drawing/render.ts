import type { Drawing, Stroke } from '@scribble/shared';

/** Small fast seeded random generator, so a stroke's pencil grain is identical every time it is drawn. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Grain seed for the stroke at this position in a drawing. */
export function strokeSeed(index: number): number {
  return Math.imul(index + 1, 2654435761) >>> 0;
}

/**
 * Paints one stroke, point by point. The same painter is used while a player draws (points
 * arrive one at a time) and when a whole drawing is re-rendered, so both look exactly alike.
 *
 * The pencil is a stamp brush: along the path it scatters many tiny, semi-transparent grains,
 * denser in the middle than at the edges, which gives the soft, grainy look of graphite.
 */
export class StrokePainter {
  private readonly rand: () => number;
  private lastX = 0;
  private lastY = 0;
  private started = false;
  /** Distance travelled since the last stamp, carried between segments. */
  private carry = 0;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly stroke: Pick<Stroke, 'tool' | 'color' | 'size'>,
    /** Canvas pixels per drawing unit. */
    private readonly scale: number,
    seed: number,
  ) {
    this.rand = seededRandom(seed);
  }

  addPoint(x: number, y: number): void {
    if (!this.started) {
      this.started = true;
      this.lastX = x;
      this.lastY = y;
      if (this.stroke.tool === 'eraser') this.eraseSegment(x, y, x, y);
      else for (let i = 0; i < 3; i++) this.stamp(x, y);
      return;
    }
    if (this.stroke.tool === 'eraser') this.eraseSegment(this.lastX, this.lastY, x, y);
    else this.pencilSegment(this.lastX, this.lastY, x, y);
    this.lastX = x;
    this.lastY = y;
  }

  addPoints(points: readonly number[], from = 0): void {
    for (let i = from; i + 1 < points.length; i += 2) this.addPoint(points[i]!, points[i + 1]!);
  }

  private pencilSegment(x0: number, y0: number, x1: number, y1: number): void {
    const step = Math.max(0.5, this.stroke.size * 0.2);
    const length = Math.hypot(x1 - x0, y1 - y0);
    let d = step - this.carry;
    while (d <= length) {
      const t = length === 0 ? 0 : d / length;
      this.stamp(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
      d += step;
    }
    this.carry = length - (d - step);
  }

  private stamp(x: number, y: number): void {
    const { ctx, rand, scale } = this;
    const size = this.stroke.size;
    const radius = size / 2;
    const grains = Math.ceil(3 + size * 1.1);
    const grain = Math.max(0.8, size * 0.11);
    ctx.save();
    ctx.fillStyle = this.stroke.color;
    for (let i = 0; i < grains; i++) {
      // Two randoms summed: grains bunch towards the middle of the line, like pencil pressure.
      const dx = (rand() + rand() - 1) * radius;
      const dy = (rand() + rand() - 1) * radius;
      const alpha = 0.18 + rand() * 0.45;
      const g = grain * (0.6 + rand() * 0.8);
      if (dx * dx + dy * dy > radius * radius) continue;
      ctx.globalAlpha = alpha;
      ctx.fillRect((x + dx - g / 2) * scale, (y + dy - g / 2) * scale, g * scale, g * scale);
    }
    ctx.restore();
  }

  private eraseSegment(x0: number, y0: number, x1: number, y1: number): void {
    const { ctx, scale } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = this.stroke.size * scale;
    ctx.beginPath();
    ctx.moveTo(x0 * scale, y0 * scale);
    ctx.lineTo(x1 * scale + 0.01, y1 * scale);
    ctx.stroke();
    ctx.restore();
  }
}

/** Clears the canvas and paints a whole drawing. `scale` is canvas pixels per drawing unit. */
export function renderDrawing(ctx: CanvasRenderingContext2D, drawing: Drawing, scale: number): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawing.strokes.forEach((stroke, i) => {
    new StrokePainter(ctx, stroke, scale, strokeSeed(i)).addPoints(stroke.points);
  });
}

const imageCache = new WeakMap<Drawing, Map<string, string>>();
const underlayIds = new WeakMap<Drawing, number>();
let nextUnderlayId = 1;

function makeCanvas(drawing: Drawing, px: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = Math.round((px * drawing.height) / drawing.width);
  return canvas;
}

/**
 * Renders a drawing to a PNG data URL, `px` pixels wide, optionally on top of an `underlay`
 * (like the avatar body). The underlay is painted on its own layer, so the drawing's eraser
 * strokes don't cut into it. Cached per drawing, size and underlay, so showing the same avatar
 * in many places costs one render.
 */
export function drawingToDataUrl(drawing: Drawing, px: number, underlay?: Drawing): string {
  let underlayId = 0;
  if (underlay) {
    underlayId = underlayIds.get(underlay) ?? nextUnderlayId++;
    underlayIds.set(underlay, underlayId);
  }
  const key = `${px}:${underlayId}`;
  let sizes = imageCache.get(drawing);
  if (!sizes) imageCache.set(drawing, (sizes = new Map()));
  const cached = sizes.get(key);
  if (cached) return cached;

  const canvas = makeCanvas(drawing, px);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const scale = px / drawing.width;
  if (underlay) {
    renderDrawing(ctx, underlay, scale);
    const top = makeCanvas(drawing, px);
    const topCtx = top.getContext('2d');
    if (topCtx) {
      renderDrawing(topCtx, drawing, scale);
      ctx.drawImage(top, 0, 0);
    }
  } else {
    renderDrawing(ctx, drawing, scale);
  }
  const url = canvas.toDataURL('image/png');
  sizes.set(key, url);
  return url;
}

export function countPoints(drawing: Drawing): number {
  return drawing.strokes.reduce((n, s) => n + s.points.length / 2, 0);
}

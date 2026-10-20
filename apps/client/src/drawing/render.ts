import { STROKE_OPACITY_FALLBACK, strokeCost, type Drawing, type FillStroke, type PathStroke } from '@scribble/shared';

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

/**
 * How strongly to lay down colour for an opacity. At or below the fallback (60%) it is the
 * opacity itself; above it ramps up faster, so 100% reads as nearly solid.
 */
export function pencilStrength(opacity: number | undefined): { opacity: number; extra: number; strength: number } {
  const o = opacity ?? STROKE_OPACITY_FALLBACK;
  const extra = Math.max(0, o - STROKE_OPACITY_FALLBACK);
  return { opacity: o, extra, strength: o * (1 + extra * 2.5) };
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
    private readonly stroke: Pick<PathStroke, 'tool' | 'color' | 'size' | 'opacity'>,
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
    // Opacity darkens each grain and packs grains closer, so 100% reads as a nearly solid line.
    const { opacity, extra, strength } = pencilStrength(this.stroke.opacity);
    const grains = Math.ceil((3 + size * 1.1) * (0.6 + opacity * 0.7) * (1 + extra * 1.2));
    const grain = Math.max(0.8, size * 0.11);
    ctx.save();
    ctx.fillStyle = this.stroke.color;
    for (let i = 0; i < grains; i++) {
      // Two randoms summed: grains bunch towards the middle of the line, like pencil pressure.
      const dx = (rand() + rand() - 1) * radius;
      const dy = (rand() + rand() - 1) * radius;
      const alpha = Math.min(1, (0.3 + rand() * 0.7) * strength);
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

/** Side of a fill texture tile, in drawing units. Tiles are drawn at 2 px per unit. */
const TILE_UNITS = 48;
const tiles = new Map<string, HTMLCanvasElement>();

/**
 * A small seamless tile of colour wash plus pencil grain, made once per colour and strength.
 * Fills are painted with it as a pattern, so a fill costs a handful of draw calls however big
 * it is (painting grains one by one took seconds for a full-canvas fill).
 */
function fillTile(color: string, strength: number): HTMLCanvasElement {
  const key = `${color}|${strength.toFixed(3)}`;
  const cached = tiles.get(key);
  if (cached) return cached;

  const px = TILE_UNITS * 2;
  const tile = document.createElement('canvas');
  tile.width = tile.height = px;
  const ctx = tile.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.globalAlpha = Math.min(0.9, 0.6 * strength);
  ctx.fillRect(0, 0, px, px);
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  const rand = seededRandom(hash);
  const grains = Math.round(TILE_UNITS * TILE_UNITS * 0.5);
  for (let i = 0; i < grains; i++) {
    const x = rand() * px;
    const y = rand() * px;
    const g = (0.8 + rand() * 1.2) * 2;
    ctx.globalAlpha = Math.min(1, rand() * 0.45 * strength);
    // Grains crossing an edge are drawn on the opposite side too, so the tile repeats without seams.
    for (const dx of x + g > px ? [0, -px] : [0]) {
      for (const dy of y + g > px ? [0, -px] : [0]) ctx.fillRect(x + dx, y + dy, g, g);
    }
  }
  tiles.set(key, tile);
  return tile;
}

let fillScratch: HTMLCanvasElement | null = null;

/**
 * Paints a bucket fill: an even wash of colour with pencil grain, like an area shaded in with a
 * coloured pencil. The region is drawn solid into a scratch canvas, textured with the tile, then
 * copied over. `seed` shifts the texture so neighbouring fills don't line up.
 */
export function paintFill(ctx: CanvasRenderingContext2D, fill: FillStroke, scale: number, seed: number): void {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < fill.spans.length; i += 3) {
    minY = Math.min(minY, fill.spans[i]!);
    maxY = Math.max(maxY, fill.spans[i]! + fill.rowHeight);
    minX = Math.min(minX, fill.spans[i + 1]!);
    maxX = Math.max(maxX, fill.spans[i + 2]!);
  }
  if (minX >= maxX) return;
  const left = Math.floor(minX * scale);
  const top = Math.floor(minY * scale);
  const width = Math.ceil(maxX * scale) - left;
  const height = Math.ceil(maxY * scale) - top;

  fillScratch ??= document.createElement('canvas');
  if (fillScratch.width < width) fillScratch.width = width;
  if (fillScratch.height < height) fillScratch.height = height;
  const sctx = fillScratch.getContext('2d')!;
  sctx.globalCompositeOperation = 'source-over';
  sctx.clearRect(0, 0, width, height);

  // The shape, solid. Rows overlap by a sliver so there are no seams when scaled.
  sctx.fillStyle = '#000';
  for (let i = 0; i < fill.spans.length; i += 3) {
    const [y, x0, x1] = [fill.spans[i]!, fill.spans[i + 1]!, fill.spans[i + 2]!];
    sctx.fillRect(x0 * scale - left, y * scale - top, (x1 - x0) * scale, fill.rowHeight * scale + 0.5);
  }

  // Keep the shape, take the colour and grain from the tile.
  const rand = seededRandom(seed);
  const pattern = sctx.createPattern(fillTile(fill.color, pencilStrength(fill.opacity).strength), 'repeat')!;
  pattern.setTransform(
    new DOMMatrix().translateSelf(rand() * TILE_UNITS * scale - left, rand() * TILE_UNITS * scale - top).scaleSelf(scale / 2),
  );
  sctx.globalCompositeOperation = 'source-in';
  sctx.fillStyle = pattern;
  sctx.fillRect(0, 0, width, height);

  ctx.drawImage(fillScratch, 0, 0, width, height, left, top, width, height);
}

/** Clears the canvas and paints a whole drawing. `scale` is canvas pixels per drawing unit. */
export function renderDrawing(ctx: CanvasRenderingContext2D, drawing: Drawing, scale: number): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawing.strokes.forEach((stroke, i) => {
    if (stroke.tool === 'fill') paintFill(ctx, stroke, scale, strokeSeed(i));
    else new StrokePainter(ctx, stroke, scale, strokeSeed(i)).addPoints(stroke.points);
  });
}

const imageCache = new WeakMap<Drawing, Map<number, string>>();

/**
 * Renders a drawing to a PNG data URL, `px` pixels wide. Cached per drawing object and size,
 * so showing the same avatar in many places costs one render.
 */
export function drawingToDataUrl(drawing: Drawing, px: number): string {
  let sizes = imageCache.get(drawing);
  if (!sizes) imageCache.set(drawing, (sizes = new Map()));
  const cached = sizes.get(px);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = Math.round((px * drawing.height) / drawing.width);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  renderDrawing(ctx, drawing, px / drawing.width);
  const url = canvas.toDataURL('image/png');
  sizes.set(px, url);
  return url;
}

/** Total cost of a drawing against DrawingLimits.maxPoints (points plus fill spans). */
export function countPoints(drawing: Drawing): number {
  return drawing.strokes.reduce((n, s) => n + strokeCost(s), 0);
}

import type { Drawing, FillStroke } from '@scribble/shared';

/** Underlay pixels darker than this (composited over white) count as outlines that stop a fill. */
const UNDERLAY_EDGE_LUMINANCE = 0.78;

/** Mask pixels per drawing unit: finer for small drawings like avatars, coarser for big canvases. */
function maskResolution(drawing: Drawing): 1 | 2 {
  return drawing.width * drawing.height > 400 * 400 ? 1 : 2;
}

/**
 * Marks every mask pixel that blocks a fill: the player's lines (drawn solid, so the gaps in
 * the pencil grain can't leak) and the dark outlines of the underlay image. Earlier fills don't
 * block, so filling a filled area again re-colours it.
 */
function edgeMask(drawing: Drawing, underlay: HTMLImageElement | null, res: number, w: number, h: number): Uint8Array {
  const edges = new Uint8Array(w * h);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  if (underlay?.complete && underlay.naturalWidth) {
    ctx.drawImage(underlay, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data;
    for (let i = 0; i < w * h; i++) {
      const a = px[i * 4 + 3]! / 255;
      const lum = (0.2126 * px[i * 4]! + 0.7152 * px[i * 4 + 1]! + 0.0722 * px[i * 4 + 2]!) / 255;
      if (1 - a * (1 - lum) < UNDERLAY_EDGE_LUMINANCE) edges[i] = 1;
    }
    ctx.clearRect(0, 0, w, h);
    // The image's pencil outline has tiny gaps between grains: thicken it by a pixel to close them.
    thicken(edges, w, h);
  }

  // The player's lines are traced solid at the width of the pencil's dense core, so the fill
  // can't leak through the grain and still reaches right up to the visible line.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ctx.fillStyle = '#000';
  for (const stroke of drawing.strokes) {
    if (stroke.tool === 'fill') continue;
    ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineWidth = Math.max(1, stroke.size * (stroke.tool === 'eraser' ? 1 : 0.6) * res);
    const p = stroke.points;
    ctx.beginPath();
    ctx.moveTo(p[0]! * res, p[1]! * res);
    for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i]! * res, p[i + 1]! * res);
    if (p.length === 2) ctx.lineTo(p[0]! * res + 0.01, p[1]! * res);
    ctx.stroke();
  }
  const lines = ctx.getImageData(0, 0, w, h).data;
  for (let i = 0; i < w * h; i++) if (lines[i * 4 + 3]! > 128) edges[i] = 1;
  return edges;
}

/** Grows marked pixels by one in each direction, in place. */
function thicken(mask: Uint8Array, w: number, h: number): void {
  const source = mask.slice();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!source[y * w + x]) continue;
      if (x > 0) mask[y * w + x - 1] = 1;
      if (x < w - 1) mask[y * w + x + 1] = 1;
      if (y > 0) mask[(y - 1) * w + x] = 1;
      if (y < h - 1) mask[(y + 1) * w + x] = 1;
    }
  }
}

/**
 * Works out the area a bucket fill at (x, y) covers, bounded by lines, and returns it as a fill
 * stroke. Returns null when the click lands on a line.
 */
export function computeFill(
  drawing: Drawing,
  underlay: HTMLImageElement | null,
  x: number,
  y: number,
  color: string,
  opacity?: number,
): FillStroke | null {
  const res = maskResolution(drawing);
  const w = drawing.width * res;
  const h = drawing.height * res;
  const sx = Math.floor(x * res);
  const sy = Math.floor(y * res);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return null;

  const edges = edgeMask(drawing, underlay, res, w, h);
  if (edges[sy * w + sx]) return null;

  // Scanline flood fill: fill a whole run, then queue the rows above and below it.
  const filled = new Uint8Array(w * h);
  const open = (px: number, py: number) => !edges[py * w + px] && !filled[py * w + px];
  const stack: number[] = [sx, sy];
  while (stack.length) {
    const py = stack.pop()!;
    let px = stack.pop()!;
    if (!open(px, py)) continue;
    while (px > 0 && open(px - 1, py)) px--;
    let above = false;
    let below = false;
    for (; px < w && open(px, py); px++) {
      filled[py * w + px] = 1;
      if (py > 0) {
        const o = open(px, py - 1);
        if (o && !above) stack.push(px, py - 1);
        above = o;
      }
      if (py < h - 1) {
        const o = open(px, py + 1);
        if (o && !below) stack.push(px, py + 1);
        below = o;
      }
    }
  }

  const spans: number[] = [];
  for (let row = 0; row < h; row++) {
    let start = -1;
    for (let col = 0; col <= w; col++) {
      const on = col < w && filled[row * w + col];
      if (on && start < 0) start = col;
      else if (!on && start >= 0) {
        spans.push(row / res, start / res, col / res);
        start = -1;
      }
    }
  }
  if (!spans.length) return null;

  const fill: FillStroke = { tool: 'fill', color, rowHeight: 1 / res, spans };
  if (opacity !== undefined) fill.opacity = opacity;
  return fill;
}

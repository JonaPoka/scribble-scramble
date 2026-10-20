import type { Drawing, Stroke } from '@scribble/shared';

type Pt = [number, number];

/**
 * Builds drawings from code: outlines, lines and scribbled fills, all made of ordinary pencil
 * strokes. Used for the template characters; useful for any pre-made art (prompts, examples).
 */
export class Sketch {
  private readonly strokes: Stroke[] = [];

  constructor(
    readonly width = 256,
    readonly height = 256,
  ) {}

  /** A pencil line through the points. */
  line(points: Pt[], color: string, size = 5): this {
    this.strokes.push({ tool: 'pencil', color, size, points: points.flat() });
    return this;
  }

  dot(x: number, y: number, color: string, size = 6): this {
    return this.line([[x, y]], color, size);
  }

  /**
   * An ellipse outline. It wobbles a little and overshoots its start, like a circle drawn by hand.
   * `from` and `to` (radians, 0 = right, clockwise) draw only part of it.
   */
  ellipse(cx: number, cy: number, rx: number, ry: number, color: string, size = 5, from = 0, to = Math.PI * 2.12): this {
    return this.line(ellipsePoints(cx, cy, rx, ry, from, to, true), color, size);
  }

  /** Colours in a convex shape with a zig-zag scribble, like shading with a pencil. */
  fill(polygon: Pt[], color: string, size = 9, angle = -0.5): this {
    const gap = size * 0.7;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    // Rotate the shape so the scribble lines are horizontal, scan it, then rotate back.
    const rotated = polygon.map(([x, y]): Pt => [x * cos + y * sin, -x * sin + y * cos]);
    const ys = rotated.map((p) => p[1]);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const path: Pt[] = [];
    let leftToRight = true;
    for (let y = minY + gap / 2; y < maxY; y += gap) {
      const xs: number[] = [];
      rotated.forEach(([x0, y0], i) => {
        const [x1, y1] = rotated[(i + 1) % rotated.length]!;
        if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) xs.push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0));
      });
      if (xs.length < 2) continue;
      const inset = size * 0.3;
      const a = Math.min(...xs) + inset;
      const b = Math.max(...xs) - inset;
      if (b <= a) continue;
      path.push(...((leftToRight ? [[a, y], [b, y]] : [[b, y], [a, y]]) as Pt[]));
      leftToRight = !leftToRight;
    }
    if (path.length) this.line(path.map(([x, y]): Pt => [x * cos - y * sin, x * sin + y * cos]), color, size);
    return this;
  }

  fillEllipse(cx: number, cy: number, rx: number, ry: number, color: string, size = 9): this {
    return this.fill(ellipsePoints(cx, cy, rx, ry, 0, Math.PI * 2, false), color, size);
  }

  /** A closed outline through the points. */
  shape(points: Pt[], color: string, size = 5): this {
    return this.line([...points, points[0]!], color, size);
  }

  build(): Drawing {
    return { width: this.width, height: this.height, strokes: this.strokes.map((s) => ({ ...s, points: s.points.map((n) => Math.round(n * 10) / 10) })) };
  }
}

function ellipsePoints(cx: number, cy: number, rx: number, ry: number, from: number, to: number, wobble: boolean): Pt[] {
  const steps = Math.max(12, Math.ceil(((to - from) / (Math.PI * 2)) * 48));
  const points: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = from + ((to - from) * i) / steps;
    const w = wobble ? 1 + 0.025 * Math.sin(t * 3 + cx) : 1;
    points.push([cx + Math.cos(t) * rx * w, cy + Math.sin(t) * ry * w]);
  }
  return points;
}

import { strokeCost, type Drawing, type DrawingTool, type PathStroke, type Stroke } from '@scribble/shared';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { computeFill } from './fill';
import { countPoints, paintFill, renderDrawing, StrokePainter, strokeSeed } from './render';

export interface DrawingCanvasProps {
  drawing: Drawing;
  /** Called with the new drawing each time a stroke is finished. */
  onChange?: (drawing: Drawing) => void;
  tool: DrawingTool;
  color: string;
  size: number;
  /** Pencil and fill darkness, MIN_STROKE_OPACITY to 1. Leave out for the fallback look. Ignored by the eraser. */
  opacity?: number;
  /** Turns input off (another player's turn, results phase). The drawing still shows. */
  disabled?: boolean;
  /** Image URL shown underneath on its own layer, which the eraser can't touch (e.g. the avatar body). */
  underlay?: string;
  /** Called as the current pencil or eraser stroke grows. Use it to stream a live stroke to other players. */
  onStrokeProgress?: (stroke: PathStroke) => void;
  /** Stop accepting new strokes or points past these limits (match the server's DrawingLimits). */
  maxStrokes?: number;
  maxPoints?: number;
  /** Accessible name, e.g. "Draw your character". */
  label: string;
  className?: string;
}

/** Points closer than this (in drawing units) to the previous one are skipped. */
const MIN_POINT_GAP = 1.5;

/**
 * The drawing surface used by every drawing feature. It owns pointer input and painting;
 * the parent owns the drawing (pair it with useDrawingHistory for undo).
 */
export function DrawingCanvas({
  drawing,
  onChange,
  tool,
  color,
  size,
  opacity,
  disabled,
  underlay,
  onStrokeProgress,
  maxStrokes = Infinity,
  maxPoints = Infinity,
  label,
  className,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const underlayRef = useRef<HTMLImageElement>(null);
  const scaleRef = useRef(1);
  const drawingRef = useRef(drawing);
  drawingRef.current = drawing;
  /** The strokes array currently painted on the canvas, to skip needless full re-renders. */
  const paintedRef = useRef<Stroke[] | null>(null);
  const activeRef = useRef<{ pointerId: number; stroke: PathStroke; painter: StrokePainter; budget: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const repaint = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    renderDrawing(ctx, drawingRef.current, scaleRef.current);
    paintedRef.current = drawingRef.current.strokes;
  }, []);

  // Match the canvas's pixel size to its on-screen size (sharp on high-DPI screens).
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      // clientWidth is the layout size. getBoundingClientRect() would include CSS transforms, so a
      // canvas measured mid-animation (the popup scales in from 30%) would get too few pixels and blur.
      const cssWidth = canvas.clientWidth;
      if (!cssWidth) return;
      const px = Math.round(cssWidth * Math.min(window.devicePixelRatio || 1, 2));
      if (canvas.width === px) return;
      canvas.width = px;
      canvas.height = Math.round((px * drawingRef.current.height) / drawingRef.current.width);
      scaleRef.current = px / drawingRef.current.width;
      repaint();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [repaint]);

  // Repaint when the drawing changes from outside (undo, clear, remote strokes).
  useEffect(() => {
    if (drawing.strokes !== paintedRef.current) repaint();
  }, [drawing, repaint]);

  const toLocal = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * drawing.width,
      y: ((e.clientY - rect.top) / rect.height) * drawing.height,
    };
  };

  const commit = (stroke: Stroke) => {
    const strokes = [...drawingRef.current.strokes, stroke];
    paintedRef.current = strokes;
    onChange?.({ ...drawingRef.current, strokes });
  };

  const bucketFill = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const fill = computeFill(drawing, underlayRef.current, x, y, color, opacity);
    if (!fill || countPoints(drawing) + strokeCost(fill) > maxPoints) return;
    paintFill(ctx, fill, scaleRef.current, strokeSeed(drawing.strokes.length));
    commit(fill);
  };

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (disabled || e.button !== 0 || activeRef.current) return;
    if (drawing.strokes.length >= maxStrokes) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    e.preventDefault();

    const { x, y } = toLocal(e);
    if (tool === 'fill') {
      bucketFill(ctx, x, y);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    const stroke: PathStroke =
      tool === 'pencil' && opacity !== undefined ? { tool, color, size, opacity, points: [x, y] } : { tool, color, size, points: [x, y] };
    const painter = new StrokePainter(ctx, stroke, scaleRef.current, strokeSeed(drawing.strokes.length));
    painter.addPoint(x, y);
    activeRef.current = { pointerId: e.pointerId, stroke, painter, budget: maxPoints - countPoints(drawing) - 1 };
    onStrokeProgress?.(stroke);
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    setCursor(e.pointerType === 'mouse' ? toLocal(e) : null);
    const active = activeRef.current;
    if (!active || active.pointerId !== e.pointerId) return;

    // Coalesced events give every point the pointer passed through, for smooth fast strokes.
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    const { points } = active.stroke;
    let added = false;
    for (const ev of events.length ? events : [e.nativeEvent]) {
      if (active.budget <= 0) break;
      const { x, y } = toLocal(ev);
      const lx = points[points.length - 2]!;
      const ly = points[points.length - 1]!;
      if (Math.hypot(x - lx, y - ly) < MIN_POINT_GAP) continue;
      points.push(x, y);
      active.painter.addPoint(x, y);
      active.budget -= 1;
      added = true;
    }
    if (added) onStrokeProgress?.(active.stroke);
  };

  const finish = (e: PointerEvent<HTMLCanvasElement>) => {
    const active = activeRef.current;
    if (!active || active.pointerId !== e.pointerId) return;
    activeRef.current = null;
    commit(active.stroke);
  };

  // The fill tool uses a plain crosshair; the others show a ring the size of the brush.
  const cursorStyle: CSSProperties | undefined = cursor && tool !== 'fill'
    ? {
        left: `${(cursor.x / drawing.width) * 100}%`,
        top: `${(cursor.y / drawing.height) * 100}%`,
        width: `${(size / drawing.width) * 100}%`,
        borderColor: tool === 'eraser' ? undefined : color,
      }
    : undefined;

  return (
    <div className={['draw-canvas', disabled && 'draw-canvas--off', tool === 'fill' && 'draw-canvas--fill', className].filter(Boolean).join(' ')}>
      {underlay && <img ref={underlayRef} className="draw-canvas__underlay" src={underlay} alt="" draggable={false} />}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        style={{ aspectRatio: `${drawing.width} / ${drawing.height}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        onPointerLeave={() => setCursor(null)}
      />
      {cursorStyle && !disabled && (
        <span className={tool === 'eraser' ? 'draw-cursor draw-cursor--eraser' : 'draw-cursor'} style={cursorStyle} aria-hidden="true" />
      )}
    </div>
  );
}

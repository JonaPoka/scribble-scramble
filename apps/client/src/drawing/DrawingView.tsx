import type { Drawing } from '@scribble/shared';
import { drawingToDataUrl } from './render';

/** Renders sizes in steps so nearby sizes share one cached image. */
function bucket(px: number): number {
  const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  const target = px * dpr;
  for (const b of [64, 128, 256, 512, 1024]) if (target <= b) return b;
  return 1024;
}

/** A read-only drawing shown as an image (avatars, thumbnails, galleries of finished drawings). */
export function DrawingView({ drawing, size, alt = '', className }: { drawing: Drawing; size: number; alt?: string; className?: string }) {
  return <img className={className} src={drawingToDataUrl(drawing, bucket(size))} width={size} height={Math.round((size * drawing.height) / drawing.width)} alt={alt} draggable={false} />;
}

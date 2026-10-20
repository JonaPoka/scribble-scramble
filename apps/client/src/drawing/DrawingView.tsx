import type { Drawing } from '@scribble/shared';
import { drawingToDataUrl } from './render';

/** Renders sizes in steps so nearby sizes share one cached image. */
function bucket(px: number): number {
  const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  const target = px * dpr;
  for (const b of [64, 128, 256, 512, 1024]) if (target <= b) return b;
  return 1024;
}

interface DrawingViewProps {
  drawing: Drawing;
  size: number;
  /** Painted underneath on its own layer (e.g. the avatar body). */
  underlay?: Drawing;
  alt?: string;
  className?: string;
}

/** A read-only drawing shown as an image (avatars, thumbnails, galleries of finished drawings). */
export function DrawingView({ drawing, size, underlay, alt = '', className }: DrawingViewProps) {
  return <img className={className} src={drawingToDataUrl(drawing, bucket(size), underlay)} width={size} height={Math.round((size * drawing.height) / drawing.width)} alt={alt} draggable={false} />;
}

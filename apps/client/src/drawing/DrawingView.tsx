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
  /** Image URL shown underneath (e.g. the avatar body). The view then fills its container. */
  underlay?: string;
  alt?: string;
  className?: string;
}

/** A read-only drawing shown as an image (avatars, thumbnails, galleries of finished drawings). */
export function DrawingView({ drawing, size, underlay, alt = '', className }: DrawingViewProps) {
  const src = drawingToDataUrl(drawing, bucket(size));
  if (!underlay) {
    const height = Math.round((size * drawing.height) / drawing.width);
    return <img className={className} src={src} width={size} height={height} alt={alt} draggable={false} />;
  }
  return (
    <span className={['draw-view', className].filter(Boolean).join(' ')} style={{ aspectRatio: `${drawing.width} / ${drawing.height}` }}>
      <img src={underlay} alt="" draggable={false} />
      <img src={src} alt={alt} draggable={false} />
    </span>
  );
}

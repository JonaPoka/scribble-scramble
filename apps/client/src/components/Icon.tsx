import type { AvatarFace } from '@scribble/shared';
import type { ReactNode } from 'react';

/** Doodle icons from the design sheet: 24px grid, 2.25 stroke, drawn in currentColor. */
const ICONS = {
  pencil: (
    <>
      <path d="M4 20l1.1-4.7L15.6 4.8a2.1 2.1 0 0 1 3 0l.6.6a2.1 2.1 0 0 1 0 3L8.7 18.9z" />
      <path d="M13.9 6.6l3.5 3.5" />
      <path d="M5.1 15.3l3.6 3.6" />
      <path d="M3.2 21.2c1.4-.5 2.4-.3 3.6.2" />
    </>
  ),
  bomb: (
    <>
      <circle cx="10" cy="14.2" r="6.6" />
      <path d="M14.6 9.4l2.1-2.1" />
      <path d="M16.7 7.3c.9-1.6 2.4-2 3.6-1.3" />
      <path d="M20.6 2.6v1.6M22.2 4.9h-1.5M18.6 3.2l.9 1" />
      <path d="M7.2 12.6a3.2 3.2 0 0 1 2.2-2.1" />
    </>
  ),
  crown: (
    <>
      <path d="M4.2 16.6L3 7.2l5.1 4 3.9-6.6 3.9 6.6 5.1-4-1.2 9.4z" />
      <path d="M3.8 19.6c5.4.6 11 .6 16.4 0" />
    </>
  ),
  stopwatch: (
    <>
      <circle cx="12" cy="13.6" r="7.6" />
      <path d="M12 13.6V9.5" />
      <path d="M12 13.6l2.7 1.9" />
      <path d="M9.8 2.8h4.4" />
      <path d="M12 2.9v3.1" />
      <path d="M18.5 6.6l1.5-1.5" />
    </>
  ),
  bolt: <path d="M13.6 2.4L4.9 13.6h6.2l-1.6 8 8.8-11.3h-6.2z" />,
  eye: (
    <>
      <path d="M2.4 12.2s3.6-6.6 9.6-6.6 9.6 6.6 9.6 6.6-3.6 6.4-9.6 6.4-9.6-6.4-9.6-6.4z" />
      <circle cx="12" cy="12" r="2.7" />
    </>
  ),
  chat: (
    <>
      <path d="M4.1 5.4h15.8a1.6 1.6 0 0 1 1.6 1.6v8.4a1.6 1.6 0 0 1-1.6 1.6h-9.7l-4.6 3.6v-3.6H4.1a1.6 1.6 0 0 1-1.6-1.6V7a1.6 1.6 0 0 1 1.6-1.6z" />
      <path d="M7.4 9.9h9.2M7.4 13h5.6" />
    </>
  ),
  star: <path d="M12 2.9l2.8 5.7 6.2.9-4.5 4.3 1.1 6.2L12 17.1l-5.6 2.9 1.1-6.2L3 9.5l6.2-.9z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <circle cx="12" cy="12" r="4.8" />
      <path d="M12 11.6v.8" />
    </>
  ),
  check: <path d="M4.4 12.9l4.6 4.7L19.8 6.2" />,
  cross: <path d="M5.6 5.4l13 13.2M18.4 5.6L5.4 18.4" />,
  copy: (
    <>
      <rect x="8.4" y="8.2" width="12.2" height="12.4" rx="2" />
      <path d="M15.6 8.1V5a1.6 1.6 0 0 0-1.6-1.6H5a1.6 1.6 0 0 0-1.6 1.6v9a1.6 1.6 0 0 0 1.6 1.6h3.3" />
    </>
  ),
};

export type IconName = keyof typeof ICONS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

const FACES: Record<AvatarFace, ReactNode> = {
  smile: (
    <>
      <path d="M11 12.5v2.2M21 12.5v2.2" />
      <path d="M10.4 19.6c3.1 3.2 8.1 3.2 11.2 0" />
    </>
  ),
  grin: (
    <>
      <path d="M10 13.4c.7-1.4 1.9-1.4 2.6 0M19.4 13.4c.7-1.4 1.9-1.4 2.6 0" />
      <path d="M10 18.4h12c-.6 4-3.2 5.6-6 5.6s-5.4-1.6-6-5.6z" />
    </>
  ),
  wow: (
    <>
      <path d="M11 12v2.4M21 12v2.4" />
      <circle cx="16" cy="21" r="2.6" />
    </>
  ),
  smirk: (
    <>
      <path d="M11 12.5v2.2M21 12.5v2.2" />
      <path d="M12 21c2.6.9 5.6.6 8.6-1.6" />
    </>
  ),
  dizzy: (
    <>
      <path d="M9.6 11.4l3 3M12.6 11.4l-3 3M19.4 11.4l3 3M22.4 11.4l-3 3" />
      <path d="M12 21.4c1.4-1.2 2.6-1.2 4 0s2.6 1.2 4 0" />
    </>
  ),
};

export function Face({ face }: { face: AvatarFace }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {FACES[face]}
    </svg>
  );
}

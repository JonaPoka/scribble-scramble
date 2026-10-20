/**
 * Pencil colours. These are drawing content (stored inside strokes), not UI colours, so they are
 * plain hex values. The crayons match the design sheet's crayon tokens.
 */
export const PENCIL_PALETTE = [
  { name: 'Ink', hex: '#2b1d14' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Grey', hex: '#9c958a' },
  { name: 'Brown', hex: '#7a4b2a' },
  { name: 'Peach', hex: '#f6cfa8' },
  { name: 'Tan', hex: '#d39a6a' },
  { name: 'Tomato', hex: '#ff5d4f' },
  { name: 'Tangerine', hex: '#ff9f1c' },
  { name: 'Sunny', hex: '#ffd23f' },
  { name: 'Grass', hex: '#63d471' },
  { name: 'Forest', hex: '#2e8b47' },
  { name: 'Sky', hex: '#4cc4f0' },
  { name: 'Navy', hex: '#2f4fa8' },
  { name: 'Grape', hex: '#a07bff' },
  { name: 'Bubblegum', hex: '#ff86c2' },
  { name: 'Blush', hex: '#ffc2d4' },
] as const;

export const DEFAULT_PENCIL_COLOR = PENCIL_PALETTE[0].hex;

/** Starting pencil opacity: dark enough to read clearly, still a little grainy. */
export const DEFAULT_PENCIL_OPACITY = 0.85;

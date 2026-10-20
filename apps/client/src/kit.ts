/**
 * UI pieces minigames can use in their client.tsx: `import { Stamp } from '@scribble/client/kit'`.
 * They all follow the design sheet, so a minigame built from them matches the rest of the game.
 */
export { Avatar, PlayerChip, Scoreboard, Stamp, Timer, crayonStyle } from './components/ui';
export { Face, Icon, type IconName } from './components/Icon';
export { useCountdown } from './useCountdown';
export { useAvatar } from './store';
// The drawing system, for drawing minigames: see src/drawing/README.md.
export {
  CharacterEditor,
  ColorPicker,
  DrawingCanvas,
  DrawingTools,
  DrawingView,
  PENCIL_PALETTE,
  DEFAULT_PENCIL_COLOR,
  Sketch,
  StrokePainter,
  renderDrawing,
  strokeSeed,
  useDrawingHistory,
} from './drawing';

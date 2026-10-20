import type { PlayableMinigameId } from '@scribble/shared';
import type { ComponentType } from 'react';
import { ColorClash } from './ColorClash';
import { QuickDraw } from './QuickDraw';
import type { MinigameViewProps } from './types';

/** The client half of every playable minigame. The compiler errors here if one is missing. */
export const MINIGAME_VIEWS: { [K in PlayableMinigameId]: ComponentType<MinigameViewProps<K>> } = {
  'quick-draw': QuickDraw,
  'color-clash': ColorClash,
};

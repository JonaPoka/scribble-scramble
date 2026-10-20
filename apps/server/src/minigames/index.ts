import type { PlayableMinigameId } from '@scribble/shared';
import type { MinigameDefinition } from '../types';
import { colorClash } from './color-clash';
import { quickDraw } from './quick-draw';

/** Every playable minigame. The compiler errors here if one in PLAYABLE_MINIGAMES is missing. */
export const MINIGAME_REGISTRY: { [K in PlayableMinigameId]: MinigameDefinition<K> } = {
  'quick-draw': quickDraw,
  'color-clash': colorClash,
};

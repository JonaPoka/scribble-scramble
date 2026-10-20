/** A colour word in a different ink colour. Tap the ink, not the word. */

export const CLASH_COLORS = ['tomato', 'sky', 'sunny', 'grass'] as const;
export type ClashColor = (typeof CLASH_COLORS)[number];

export const CLASH_WORDS: Record<ClashColor, string> = {
  tomato: 'RED',
  sky: 'BLUE',
  sunny: 'YELLOW',
  grass: 'GREEN',
};

export type ColorClashInput = { type: 'answer'; index: number; color: ClashColor };

export type ColorClashEvent =
  /** The next prompt for this player. Each player moves through prompts at their own pace. */
  | { type: 'prompt'; index: number; word: ClashColor; ink: ClashColor }
  /** Result of this player's last answer. */
  | { type: 'feedback'; index: number; correct: boolean; streak: number; score: number };

export const COLOR_CLASH_DURATION_MS = 20_000;
export const COLOR_CLASH_POINTS_PER_HIT = 50;
/** Extra points per answer in a streak, capped at this many streak steps. */
export const COLOR_CLASH_STREAK_BONUS = 10;
export const COLOR_CLASH_STREAK_CAP = 5;

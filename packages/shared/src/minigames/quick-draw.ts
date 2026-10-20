/** Players wait for GO, then click first. Clicking before GO disqualifies you. */

export type QuickDrawInput = { type: 'click' };

export type QuickDrawEvent =
  /** Round started: everyone waits. */
  | { type: 'wait' }
  /** GO! Clicks count from now. */
  | { type: 'go' }
  /** Sent only to a player who clicked before GO. */
  | { type: 'early' }
  /** Sent only to the player who clicked, with their place (1 = first). */
  | { type: 'clicked'; place: number; reactionMs: number }
  /** Final order, sent to everyone when the minigame ends. */
  | { type: 'standings'; order: { playerId: string; reactionMs: number }[]; early: string[] };

/** Points by finishing place. Anyone who clicks after these gets the last value. */
export const QUICK_DRAW_POINTS = [500, 350, 250, 150, 100] as const;

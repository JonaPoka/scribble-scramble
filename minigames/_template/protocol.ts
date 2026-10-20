// The messages your server.ts and client.tsx send each other, plus any constants both need.
// Use a `type` field on every message so each side can tell them apart.

/** What a player's browser sends to the server. */
export type PlayerInput = { type: 'tap' };

/** What the server sends to players. */
export type GameEvent =
  /** Sent to one player after each of their taps. */
  | { type: 'count'; taps: number }
  /** Sent to everyone when time is up. */
  | { type: 'final'; taps: Record<string, number> };

export const DURATION_MS = 10_000;
export const POINTS_PER_TAP = 5;

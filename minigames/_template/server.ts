// The rules. Runs on the game server; the server decides everything (scores, timing, who won).
import { defineServer } from '@scribble/shared';
import { DURATION_MS, POINTS_PER_TAP, type GameEvent, type PlayerInput } from './protocol';

/** Taps closer together than this are ignored: about 16 per second, faster than any human. */
const MIN_TAP_GAP_MS = 60;

export default defineServer<PlayerInput, GameEvent>({
  // Safety net: if the game is still running after this long, the room ends it with no points.
  maxDurationMs: DURATION_MS + 2_000,

  // Called once per round. Keep all the round's state in here.
  create(ctx) {
    const taps = new Map<string, number>();
    const lastTapAt = new Map<string, number>();

    return {
      start() {
        for (const id of ctx.playerIds) taps.set(id, 0);

        // Show a countdown in the top bar, then end the round when it runs out.
        ctx.setDeadline(DURATION_MS);
        ctx.setTimeout(() => {
          const final = Object.fromEntries(taps);
          ctx.emit({ type: 'final', taps: final });

          const points: Record<string, number> = {};
          for (const [id, count] of taps) points[id] = count * POINTS_PER_TAP;
          ctx.end(points);
        }, DURATION_MS);
      },

      // Input comes from a browser, so check it before trusting it.
      onInput(playerId, input) {
        if (input.type !== 'tap') return;
        const count = taps.get(playerId);
        if (count === undefined) return; // not playing this round

        const now = Date.now();
        if (now - (lastTapAt.get(playerId) ?? 0) < MIN_TAP_GAP_MS) return;
        lastTapAt.set(playerId, now);

        taps.set(playerId, count + 1);
        ctx.emitTo(playerId, { type: 'count', taps: count + 1 });
      },
    };
  },
});

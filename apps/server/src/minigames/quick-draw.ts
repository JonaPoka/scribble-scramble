import { QUICK_DRAW_POINTS } from '@scribble/shared';
import type { MinigameDefinition } from '../types';

const MIN_WAIT_MS = 1_500;
const MAX_WAIT_MS = 5_000;
const CLICK_WINDOW_MS = 4_000;

export const quickDraw: MinigameDefinition<'quick-draw'> = {
  id: 'quick-draw',
  maxDurationMs: MAX_WAIT_MS + CLICK_WINDOW_MS + 2_000,

  create(ctx) {
    let goAt: number | null = null;
    const early = new Set<string>();
    const clicks: { playerId: string; reactionMs: number }[] = [];

    const finish = () => {
      const points: Record<string, number> = {};
      clicks.forEach((click, i) => {
        points[click.playerId] = QUICK_DRAW_POINTS[Math.min(i, QUICK_DRAW_POINTS.length - 1)] ?? 0;
      });
      ctx.emit({ type: 'standings', order: clicks, early: [...early] });
      ctx.end(points);
    };

    return {
      start() {
        ctx.emit({ type: 'wait' });
        const wait = MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS);
        ctx.setTimeout(() => {
          goAt = Date.now();
          ctx.emit({ type: 'go' });
          ctx.setDeadline(CLICK_WINDOW_MS);
          ctx.setTimeout(finish, CLICK_WINDOW_MS);
        }, wait);
      },

      onInput(playerId, input) {
        if (input?.type !== 'click') return;
        if (early.has(playerId) || clicks.some((c) => c.playerId === playerId)) return;

        if (goAt === null) {
          early.add(playerId);
          ctx.emitTo(playerId, { type: 'early' });
        } else {
          const reactionMs = Date.now() - goAt;
          clicks.push({ playerId, reactionMs });
          ctx.emitTo(playerId, { type: 'clicked', place: clicks.length, reactionMs });
        }

        if (early.size + clicks.length >= ctx.playerIds.length) finish();
      },
    };
  },
};

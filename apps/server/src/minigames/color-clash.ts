import {
  CLASH_COLORS,
  COLOR_CLASH_DURATION_MS,
  COLOR_CLASH_POINTS_PER_HIT,
  COLOR_CLASH_STREAK_BONUS,
  COLOR_CLASH_STREAK_CAP,
  type ClashColor,
} from '@scribble/shared';
import type { MinigameDefinition } from '../types';

/** How often the ink matches the word, to catch players who stop reading. */
const SAME_INK_CHANCE = 0.15;
/** Answers faster than a human can read the prompt are ignored, so mashing or scripts don't pay. */
const MIN_ANSWER_MS = 250;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function makePrompt(): { word: ClashColor; ink: ClashColor } {
  const word = pick(CLASH_COLORS);
  const ink = Math.random() < SAME_INK_CHANCE ? word : pick(CLASH_COLORS.filter((c) => c !== word));
  return { word, ink };
}

interface PlayerProgress {
  index: number;
  prompt: { word: ClashColor; ink: ClashColor };
  score: number;
  streak: number;
  /** When the current prompt was sent. */
  promptAt: number;
}

export const colorClash: MinigameDefinition<'color-clash'> = {
  id: 'color-clash',
  maxDurationMs: COLOR_CLASH_DURATION_MS + 2_000,

  create(ctx) {
    const progress = new Map<string, PlayerProgress>();

    const sendPrompt = (playerId: string, p: PlayerProgress) => {
      p.promptAt = Date.now();
      ctx.emitTo(playerId, { type: 'prompt', index: p.index, ...p.prompt });
    };

    return {
      start() {
        for (const id of ctx.playerIds) {
          const p: PlayerProgress = { index: 0, prompt: makePrompt(), score: 0, streak: 0, promptAt: 0 };
          progress.set(id, p);
          sendPrompt(id, p);
        }
        ctx.setDeadline(COLOR_CLASH_DURATION_MS);
        ctx.setTimeout(() => {
          const points: Record<string, number> = {};
          for (const [id, p] of progress) points[id] = p.score;
          ctx.end(points);
        }, COLOR_CLASH_DURATION_MS);
      },

      onInput(playerId, input) {
        const p = progress.get(playerId);
        if (!p || input?.type !== 'answer' || input.index !== p.index) return;
        if (!CLASH_COLORS.includes(input.color)) return;
        if (Date.now() - p.promptAt < MIN_ANSWER_MS) return;

        const correct = input.color === p.prompt.ink;
        if (correct) {
          p.score += COLOR_CLASH_POINTS_PER_HIT + Math.min(p.streak, COLOR_CLASH_STREAK_CAP) * COLOR_CLASH_STREAK_BONUS;
          p.streak += 1;
        } else {
          p.streak = 0;
        }
        ctx.emitTo(playerId, { type: 'feedback', index: p.index, correct, streak: p.streak, score: p.score });

        p.index += 1;
        p.prompt = makePrompt();
        sendPrompt(playerId, p);
      },
    };
  },
};

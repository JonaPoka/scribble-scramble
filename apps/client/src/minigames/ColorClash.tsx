import { CLASH_COLORS, CLASH_WORDS, type ClashColor, type ColorClashEvent } from '@scribble/shared';
import { useEffect } from 'react';
import { Stamp } from '../components/ui';
import type { MinigameViewProps } from './types';

/** Each ink also has a pattern, so the game works for colour-blind players. */
const PATTERN: Record<ClashColor, string> = {
  tomato: 'stripes',
  sky: 'dots',
  sunny: 'zigzag',
  grass: 'plain',
};

function derive(events: ColorClashEvent[]) {
  let prompt: Extract<ColorClashEvent, { type: 'prompt' }> | null = null;
  let feedback: Extract<ColorClashEvent, { type: 'feedback' }> | null = null;
  for (const e of events) {
    if (e.type === 'prompt') prompt = e;
    else feedback = e;
  }
  return { prompt, feedback };
}

export function ColorClash({ events, phase, send }: MinigameViewProps<'color-clash'>) {
  const { prompt, feedback } = derive(events);
  const live = phase === 'playing' && prompt !== null;

  const answer = (color: ClashColor) => {
    if (live && prompt) send({ type: 'answer', index: prompt.index, color });
  };

  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      const color = CLASH_COLORS[Number(e.key) - 1];
      if (color) answer(color);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="cc">
      <div className="cc-score">
        <span className="ss-board__pts">{(feedback?.score ?? 0).toLocaleString()} pts</span>
        {(feedback?.streak ?? 0) >= 2 && <span className="ss-board__delta">streak ×{feedback?.streak}</span>}
      </div>

      <div className="cc-card" aria-live="polite">
        {prompt ? (
          <>
            <span className="cc-word" style={{ color: `var(--${prompt.ink})` }}>
              {CLASH_WORDS[prompt.word]}
            </span>
            <span className={`cc-ink-bar pattern-${PATTERN[prompt.ink]}`} style={{ background: `var(--${prompt.ink})` }} />
          </>
        ) : (
          <span className="note">get ready…</span>
        )}
        {feedback && (
          <span className="cc-feedback" key={feedback.index}>
            <Stamp kind={feedback.correct ? 'correct' : 'wrong'}>{feedback.correct ? 'Yes!' : 'Nope'}</Stamp>
          </span>
        )}
      </div>

      <div className="cc-answers">
        {CLASH_COLORS.map((color, i) => (
          <button
            key={color}
            type="button"
            className={`ss-btn cc-answer pattern-${PATTERN[color]}`}
            style={{ background: `var(--${color})` }}
            disabled={!live}
            onPointerDown={() => answer(color)}
          >
            <span className="cc-answer__label">{CLASH_WORDS[color].toLowerCase()}</span>
            <kbd>{i + 1}</kbd>
          </button>
        ))}
      </div>
      <p className="note">tap the colour of the ink, not the word</p>
    </div>
  );
}

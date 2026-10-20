import { Stamp } from '@scribble/client/kit';
import type { MinigameViewProps } from '@scribble/shared';
import { useEffect } from 'react';
import type { GameEvent, PlayerInput } from './protocol';
import './style.css';

type Status = 'wait' | 'go' | 'early' | 'clicked';

function derive(events: GameEvent[]) {
  let status: Status = 'wait';
  let mine: Extract<GameEvent, { type: 'clicked' }> | null = null;
  let standings: Extract<GameEvent, { type: 'standings' }> | null = null;
  for (const e of events) {
    if (e.type === 'go' && status === 'wait') status = 'go';
    else if (e.type === 'early') status = 'early';
    else if (e.type === 'clicked') {
      status = 'clicked';
      mine = e;
    } else if (e.type === 'standings') standings = e;
  }
  return { status, mine, standings };
}

export default function QuickDraw({ events, players, phase, send }: MinigameViewProps<PlayerInput, GameEvent>) {
  const { status, mine, standings } = derive(events);
  const canClick = phase === 'playing' && (status === 'wait' || status === 'go');
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? 'Someone';

  useEffect(() => {
    if (!canClick) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        send({ type: 'click' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canClick, send]);

  return (
    <div className="qd">
      <button
        type="button"
        className={`qd-pad qd-pad--${status}`}
        disabled={!canClick}
        // pointerdown, not click: it fires as soon as the finger or button goes down.
        onPointerDown={() => canClick && send({ type: 'click' })}
        aria-label={status === 'go' ? 'Click now!' : 'Wait for GO'}
      >
        {status === 'wait' && <span className="qd-pad__wait">wait for it…</span>}
        {status === 'go' && <span className="qd-pad__go">GO!</span>}
        {status === 'early' && <Stamp kind="wrong">Too early!</Stamp>}
        {status === 'clicked' && mine && (
          <span className="qd-pad__result">
            <Stamp kind={mine.place === 1 ? 'correct' : 'points'}>#{mine.place}</Stamp>
            <span className="note">{mine.reactionMs} ms</span>
          </span>
        )}
      </button>

      {standings && (
        <ol className="qd-standings">
          {standings.order.map((s, i) => (
            <li key={s.playerId}>
              <b>
                {i + 1}. {nameOf(s.playerId)}
              </b>{' '}
              <span className="tabular">{s.reactionMs} ms</span>
            </li>
          ))}
          {standings.early.length > 0 && <li className="note">too early: {standings.early.map(nameOf).join(', ')}</li>}
        </ol>
      )}
    </div>
  );
}

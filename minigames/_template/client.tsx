// What players see. Runs in the browser. Draw from `events` and call `send` for input;
// never decide scores here, the server does that.
import { Avatar, Stamp } from '@scribble/client/kit';
import type { MinigameViewProps } from '@scribble/shared';
import type { GameEvent, PlayerInput } from './protocol';
import './style.css';

export default function ButtonMash({ events, me, players, phase, send }: MinigameViewProps<PlayerInput, GameEvent>) {
  // Work out the current state from the events received so far this round.
  let myTaps = 0;
  let final: Record<string, number> | null = null;
  for (const e of events) {
    if (e.type === 'count') myTaps = e.taps;
    if (e.type === 'final') final = e.taps;
  }

  // Results: everyone's taps, most first.
  if (final) {
    const ranked = players.filter((p) => p.id in final).sort((a, b) => (final[b.id] ?? 0) - (final[a.id] ?? 0));
    return (
      <ol className="tpl-results">
        {ranked.map((p, i) => (
          <li key={p.id} className="ss-chip">
            <Avatar player={p} small />
            <span className="ss-chip__name">{p.name}</span>
            <span className="ss-chip__badge">{final[p.id]} taps</span>
            {i === 0 && <Stamp kind="points">Fastest!</Stamp>}
          </li>
        ))}
      </ol>
    );
  }

  // Playing: one big button.
  return (
    <div className="tpl">
      <button
        type="button"
        className="ss-btn ss-btn--go ss-btn--big tpl-button"
        disabled={phase !== 'playing'}
        onPointerDown={() => send({ type: 'tap' })}
      >
        Tap!
      </button>
      <p className="ss-board__pts">{myTaps} taps</p>
      <p className="note">go go go, {me.name}!</p>
    </div>
  );
}

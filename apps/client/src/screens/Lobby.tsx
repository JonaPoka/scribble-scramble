import { MAX_PLAYERS, type RoomState } from '@scribble/shared';
import { useState, type CSSProperties } from 'react';
import { Icon } from '../components/Icon';
import { MinigameCard, PlayerChip } from '../components/ui';
import { actions } from '../store';

export function Lobby({ room, playerId }: { room: RoomState; playerId: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const me = room.players.find((p) => p.id === playerId);
  const inviteLink = `${location.origin}/?room=${room.code}`;

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(`Copy failed. Share this link instead: ${inviteLink}`);
    }
  }

  async function start() {
    setError(null);
    const result = await actions.startGame();
    if (!result.ok) setError(result.error);
  }

  return (
    <main className="screen lobby">
      <header className="lobby__head">
        <h1 className="h1">Lobby</h1>
        <div className="ss-ticket">
          <div>
            <div className="ss-ticket__label">Room code</div>
            <div className="ss-ticket__code">{room.code}</div>
          </div>
          <button className="ss-btn ss-btn--go" type="button" onClick={copyInvite}>
            <Icon name={copied ? 'check' : 'copy'} /> {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </header>

      <div className="lobby__grid">
        <section className="ss-panel" style={{ '--tilt': 'var(--tilt-left)' } as CSSProperties}>
          <h2 className="ss-panel__title">
            Who's playing ({room.players.length}/{MAX_PLAYERS})
          </h2>
          <div className="ss-stack">
            {room.players.map((p) => (
              <PlayerChip key={p.id} player={p} large isMe={p.id === playerId} badge={p.isHost ? <Icon name="crown" /> : undefined} />
            ))}
          </div>
          <hr />
          <div className="lobby__actions">
            {me?.isHost ? (
              <button className="ss-btn ss-btn--go ss-btn--big" type="button" onClick={start}>
                Start game!
              </button>
            ) : (
              <button className="ss-btn" type="button" disabled>
                Waiting for host…
              </button>
            )}
            <button className="ss-btn ss-btn--ghost" type="button" onClick={actions.leaveRoom}>
              Leave room
            </button>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <p className="note">{room.settings.rounds} rounds, random minigames each round</p>
        </section>

        <section className="lobby__games" aria-label="Minigames">
          <h2 className="h2">Minigames ({room.minigames.length})</h2>
          {room.minigames.length === 0 && <p className="note">no minigames installed yet. add one to the minigames folder.</p>}
          <div className="card-grid">
            {room.minigames.map((meta) => (
              <MinigameCard key={meta.id} meta={meta} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

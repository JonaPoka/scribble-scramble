import { MINIGAMES, isPlayable, type MinigameEvent, type MinigameInput, type PlayableMinigameId, type RoomState } from '@scribble/shared';
import { useCallback, type ComponentType, type ReactNode } from 'react';
import { GameSplash, Scoreboard, Stamp, Timer, crayonStyle } from '../components/ui';
import { MINIGAME_VIEWS } from '../minigames';
import type { MinigameViewProps } from '../minigames/types';
import { actions } from '../store';
import { useCountdown } from '../useCountdown';

interface GameProps {
  room: RoomState;
  playerId: string;
  events: MinigameEvent[];
  clockOffset: number;
}

export function Game({ room, playerId, events, clockOffset }: GameProps) {
  const { round, phase, players } = room;
  const me = players.find((p) => p.id === playerId);
  const countdown = useCountdown(phase === 'intro' ? (round?.deadline ?? null) : null, clockOffset);
  const minigame = round?.minigame;

  const send = useCallback(
    (input: unknown) => {
      if (minigame && isPlayable(minigame)) actions.sendInput({ game: minigame, input } as MinigameInput);
    },
    [minigame],
  );

  if (!round || !me || !minigame) return null;
  const meta = MINIGAMES[minigame];
  const myPoints = room.lastRoundPoints[playerId] ?? 0;

  let stage: ReactNode;
  if (phase === 'intro') {
    stage = (
      <GameSplash
        minigame={minigame}
        round={round.number}
        total={round.total}
        countdown={countdown ? Math.max(1, Math.ceil(countdown.leftMs / 1000)) : null}
      />
    );
  } else if (phase === 'finished') {
    const winner = [...players].sort((a, b) => b.score - a.score)[0];
    stage = (
      <div className="finish">
        <div className="ss-splash ss-splash--go stage-splash">
          <span className="ss-splash__eyebrow">And the winner is</span>
          <h1 className="ss-splash__title">{winner?.name ?? 'Nobody'}</h1>
          <p className="ss-splash__rule">{winner?.score.toLocaleString() ?? 0} points</p>
        </div>
        <div className="lobby__actions">
          {me.isHost ? (
            <button className="ss-btn ss-btn--go ss-btn--big" type="button" onClick={() => void actions.startGame()}>
              Play again!
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
      </div>
    );
  } else if (isPlayable(minigame)) {
    const View = MINIGAME_VIEWS[minigame] as unknown as ComponentType<MinigameViewProps<PlayableMinigameId>>;
    const own = events.filter((e) => e.game === minigame).map((e) => e.event) as MinigameViewProps<PlayableMinigameId>['events'];
    stage = (
      <>
        <View events={own} me={me} players={players} phase={phase} send={send} />
        {phase === 'results' && (
          <div className="round-points">
            <Stamp kind={myPoints > 0 ? 'points' : 'wrong'}>{myPoints > 0 ? `+${myPoints}` : '+0'}</Stamp>
          </div>
        )}
      </>
    );
  }

  return (
    <main className="screen game" style={crayonStyle(meta.crayon)}>
      <header className="game__bar">
        <div>
          <div className="label">
            Round {round.number} of {round.total}
          </div>
          <h1 className="h2">{phase === 'finished' ? 'Final scores' : meta.name}</h1>
        </div>
        <Timer deadline={phase === 'finished' ? null : round.deadline} clockOffset={clockOffset} />
      </header>

      <section className="game__stage">{stage}</section>

      <aside className="game__rail ss-panel" aria-label="Scores">
        <h2 className="ss-panel__title">Scores</h2>
        <Scoreboard players={players} deltas={phase === 'results' ? room.lastRoundPoints : undefined} />
      </aside>
    </main>
  );
}

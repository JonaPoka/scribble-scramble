import type { MinigameInfo, PublicPlayer } from '@scribble/shared';
import type { CSSProperties, ReactNode } from 'react';
import { useCountdown } from '../useCountdown';
import { Face, Icon } from './Icon';

/** Sets the `--c` crayon custom property used by avatars, splashes and cards. */
export function crayonStyle(crayon: string): CSSProperties {
  return { '--c': `var(--${crayon})` } as CSSProperties;
}

export function Avatar({ player, small }: { player: Pick<PublicPlayer, 'color' | 'face'>; small?: boolean }) {
  return (
    <span className={small ? 'ss-avatar ss-avatar--sm' : 'ss-avatar'} style={crayonStyle(player.color)}>
      <Face face={player.face} />
    </span>
  );
}

export function PlayerChip({ player, isMe, badge }: { player: PublicPlayer; isMe?: boolean; badge?: ReactNode }) {
  const meta = [player.isHost && 'host', isMe && 'you', !player.connected && 'disconnected'].filter(Boolean).join(' · ');
  return (
    <div className={player.connected ? 'ss-chip' : 'ss-chip ss-chip--out'}>
      <Avatar player={player} />
      <div style={{ minWidth: 0 }}>
        <div className="ss-chip__name">{player.name}</div>
        {meta && <div className="ss-chip__meta">{meta}</div>}
      </div>
      {badge && <span className="ss-chip__badge">{badge}</span>}
    </div>
  );
}

export function Timer({ deadline, clockOffset }: { deadline: number | null; clockOffset: number }) {
  const countdown = useCountdown(deadline, clockOffset);
  const seconds = countdown ? Math.ceil(countdown.leftMs / 1000) : null;
  const percent = countdown ? Math.min(100, (countdown.leftMs / countdown.totalMs) * 100) : 100;
  // Short countdowns (the 3s intro) never turn red; only longer ones warn in their last 5 seconds.
  const low = countdown !== null && seconds !== null && seconds <= 5 && countdown.totalMs > 6000;
  return (
    <div
      className={low ? 'ss-timer ss-timer--low' : 'ss-timer'}
      role="timer"
      aria-label={seconds === null ? 'No time limit right now' : `${seconds} seconds left`}
    >
      <svg viewBox="0 0 104 104" aria-hidden="true">
        <circle className="ss-timer__track" cx="52" cy="52" r="46" />
        <circle className="ss-timer__left" cx="52" cy="52" r="38" pathLength={100} strokeDasharray={`${percent} 100`} />
      </svg>
      <span className="ss-timer__num">{seconds ?? '·'}</span>
    </div>
  );
}

export function Scoreboard({ players, deltas }: { players: PublicPlayer[]; deltas?: Record<string, number> }) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  return (
    <ol className="ss-board">
      {ranked.map((p, i) => {
        const delta = deltas?.[p.id];
        return (
          <li key={p.id} className="ss-board__row">
            <span className="ss-board__rank">{i === 0 && p.score > 0 ? <Icon name="crown" /> : i + 1}</span>
            <Avatar player={p} small />
            <span className="ss-board__name">{p.name}</span>
            <span className="ss-board__pts">
              {p.score.toLocaleString()}
              {delta ? <span className="ss-board__delta">+{delta}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function GameSplash({ meta, round, total, countdown }: { meta: MinigameInfo; round: number; total: number; countdown: number | null }) {
  return (
    <div className="ss-splash stage-splash" style={crayonStyle(meta.crayon)}>
      <span className="ss-splash__eyebrow">
        Round {round} of {total} · {meta.category}
      </span>
      <h1 className="ss-splash__title">{meta.name}</h1>
      <p className="ss-splash__rule">{meta.rule}</p>
      {countdown !== null && <span className="ss-splash__count">{countdown}</span>}
    </div>
  );
}

export function Stamp({ kind = 'correct', children }: { kind?: 'correct' | 'wrong' | 'points'; children: ReactNode }) {
  const cls = kind === 'correct' ? 'ss-stamp' : `ss-stamp ss-stamp--${kind}`;
  return (
    <span className={cls} role="status">
      {children}
    </span>
  );
}

export function MinigameCard({ meta }: { meta: MinigameInfo }) {
  return (
    <article className="ss-game" style={crayonStyle(meta.crayon)}>
      <div className="ss-game__art">
        <Icon name={meta.icon} />
      </div>
      <div className="ss-game__body">
        <span className="ss-tag">{meta.category}</span>
        <h3 className="ss-game__name">{meta.name}</h3>
        <p className="ss-game__rule">{meta.blurb}</p>
      </div>
    </article>
  );
}

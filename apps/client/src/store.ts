import type { AckResult, Drawing, JoinPayload, JoinResult, MinigameEvent, MinigameInput, RoomState } from '@scribble/shared';
import { useSyncExternalStore } from 'react';
import { socket } from './socket';

export interface GameSnapshot {
  connected: boolean;
  playerId: string | null;
  room: RoomState | null;
  /** serverTime - localTime, refreshed on every room state. */
  clockOffset: number;
  /** Minigame events for the current round, oldest first. Views derive their state from this list. */
  events: MinigameEvent[];
  /** Drawn characters by player id. */
  avatars: Record<string, Drawing>;
}

let snapshot: GameSnapshot = { connected: socket.connected, playerId: null, room: null, clockOffset: 0, events: [], avatars: {} };
const listeners = new Set<() => void>();

function update(patch: Partial<GameSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  for (const listener of listeners) listener();
}

socket.on('connect', () => update({ connected: true }));
// The server drops players when their socket disconnects, so a reconnect starts fresh.
socket.on('disconnect', () => update({ connected: false, room: null, playerId: null, events: [], avatars: {} }));
socket.on('room:state', (room) => {
  const freshRound = room.phase === 'intro' || room.phase === 'lobby';
  update({ room, clockOffset: room.serverNow - Date.now(), events: freshRound ? [] : snapshot.events });
});
socket.on('room:avatars', (avatars) => update({ avatars: { ...snapshot.avatars, ...avatars } }));
socket.on('game:event', (event) => update({ events: [...snapshot.events, event] }));

/** A player's drawn character, or undefined if they have none. */
export function useAvatar(playerId: string): Drawing | undefined {
  return useGame().avatars[playerId];
}

export function useGame(): GameSnapshot {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
  );
}

function joined(result: AckResult<JoinResult>): AckResult<JoinResult> {
  if (result.ok) update({ playerId: result.data.playerId });
  return result;
}

export const actions = {
  createRoom(payload: JoinPayload): Promise<AckResult<JoinResult>> {
    return new Promise((resolve) => socket.emit('room:create', payload, (r) => resolve(joined(r))));
  },
  joinRoom(payload: JoinPayload & { code: string }): Promise<AckResult<JoinResult>> {
    return new Promise((resolve) => socket.emit('room:join', payload, (r) => resolve(joined(r))));
  },
  leaveRoom(): void {
    socket.emit('room:leave');
    update({ room: null, playerId: null, events: [], avatars: {} });
  },
  startGame(): Promise<AckResult<null>> {
    return new Promise((resolve) => socket.emit('game:start', resolve));
  },
  sendInput(input: MinigameInput): void {
    socket.emit('game:input', input);
  },
};

import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, MinigameProtocol, PlayableMinigameId, ServerToClientEvents } from '@scribble/shared';

export interface SocketData {
  playerId?: string;
  roomCode?: string;
}

export type GameServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

/** What a running minigame can do. The room owns timers and cleans them up when the minigame ends. */
export interface MinigameContext<K extends PlayableMinigameId> {
  /** Players taking part this round (connected when the round started). */
  readonly playerIds: readonly string[];
  emit(event: MinigameProtocol[K]['event']): void;
  emitTo(playerId: string, event: MinigameProtocol[K]['event']): void;
  /** Schedule work; cancelled automatically when the minigame ends. */
  setTimeout(fn: () => void, ms: number): void;
  /** Show a countdown to everyone, ending `ms` from now. */
  setDeadline(ms: number): void;
  /** Finish the minigame and award points. Safe to call more than once; only the first call counts. */
  end(points: Record<string, number>): void;
}

export interface MinigameInstance<K extends PlayableMinigameId> {
  start(): void;
  /** Input comes straight from a client: validate it before trusting it. */
  onInput(playerId: string, input: MinigameProtocol[K]['input']): void;
}

export interface MinigameDefinition<K extends PlayableMinigameId> {
  id: K;
  /** Hard limit: the room ends the minigame with no points if it runs longer than this. */
  maxDurationMs: number;
  create(ctx: MinigameContext<K>): MinigameInstance<K>;
}

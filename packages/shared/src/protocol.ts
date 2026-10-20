import type { Drawing } from './drawing';
import type { PublicPlayer } from './players';
import type { MinigameInfo } from './sdk';

export type RoomPhase = 'lobby' | 'intro' | 'playing' | 'results' | 'finished';

export interface RoomSettings {
  rounds: number;
}

export interface RoundInfo {
  number: number;
  total: number;
  /** Folder name of the minigame being played. */
  minigame: string;
  /** Server epoch ms when the current phase ends, or null when it has no fixed end. */
  deadline: number | null;
}

export interface RoomState {
  code: string;
  phase: RoomPhase;
  players: PublicPlayer[];
  round: RoundInfo | null;
  /** Points each player earned in the round that just ended. */
  lastRoundPoints: Record<string, number>;
  settings: RoomSettings;
  /** Every minigame the server loaded from the minigames folder. */
  minigames: MinigameInfo[];
  /** Server clock when this state was sent, so clients can correct for clock skew. */
  serverNow: number;
}

/** Input from a player to the running minigame. `input` is whatever that minigame's protocol defines. */
export interface MinigameInput {
  game: string;
  input: unknown;
}

/** An event from the running minigame to players. */
export interface MinigameEvent {
  game: string;
  event: unknown;
}

export type AckResult<T> = { ok: true; data: T } | { ok: false; error: string };
export type Ack<T> = (result: AckResult<T>) => void;

export interface JoinPayload {
  name: string;
  /** The player's drawn character (AVATAR_SIZE square). Invalid drawings are dropped. */
  avatar: Drawing | null;
}

export interface JoinResult {
  code: string;
  playerId: string;
}

export interface ClientToServerEvents {
  'room:create': (payload: JoinPayload, ack: Ack<JoinResult>) => void;
  'room:join': (payload: JoinPayload & { code: string }, ack: Ack<JoinResult>) => void;
  'room:leave': () => void;
  'game:start': (ack: Ack<null>) => void;
  'game:input': (input: MinigameInput) => void;
}

export interface ServerToClientEvents {
  'room:state': (state: RoomState) => void;
  /** Drawn characters by player id. Sent in full when you join, then one at a time as others join. */
  'room:avatars': (avatars: Record<string, Drawing>) => void;
  'game:event': (event: MinigameEvent) => void;
}

export const ROOM_CODE_LENGTH = 4;
/** Room code letters: no look-alikes (O/0, I/1). */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

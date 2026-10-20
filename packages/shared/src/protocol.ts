import type { MinigameId, PlayableMinigameId } from './minigames/catalog';
import type { ColorClashEvent, ColorClashInput } from './minigames/color-clash';
import type { QuickDrawEvent, QuickDrawInput } from './minigames/quick-draw';
import type { AvatarFace, PublicPlayer } from './players';

export type RoomPhase = 'lobby' | 'intro' | 'playing' | 'results' | 'finished';

export interface RoomSettings {
  rounds: number;
}

export interface RoundInfo {
  number: number;
  total: number;
  minigame: MinigameId;
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
  /** Server clock when this state was sent, so clients can correct for clock skew. */
  serverNow: number;
}

/** Input and event types for each playable minigame. */
export interface MinigameProtocol {
  'quick-draw': { input: QuickDrawInput; event: QuickDrawEvent };
  'color-clash': { input: ColorClashInput; event: ColorClashEvent };
}

export type MinigameInput = {
  [K in PlayableMinigameId]: { game: K; input: MinigameProtocol[K]['input'] };
}[PlayableMinigameId];

export type MinigameEvent = {
  [K in PlayableMinigameId]: { game: K; event: MinigameProtocol[K]['event'] };
}[PlayableMinigameId];

export type AckResult<T> = { ok: true; data: T } | { ok: false; error: string };
export type Ack<T> = (result: AckResult<T>) => void;

export interface JoinPayload {
  name: string;
  face: AvatarFace;
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
  'game:event': (event: MinigameEvent) => void;
}

export const ROOM_CODE_LENGTH = 4;
/** Room code letters: no look-alikes (O/0, I/1). */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

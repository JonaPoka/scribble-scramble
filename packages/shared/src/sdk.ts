/**
 * The minigame SDK: everything a minigame folder (minigames/<id>/) needs to describe itself,
 * run its rules on the server and draw itself on the client. See docs/creating-minigames.md.
 */
import type { Crayon, PublicPlayer } from './players';
import type { RoomPhase } from './protocol';

export const MINIGAME_CATEGORIES = ['Draw', 'Reflex', 'Brain', 'Chaos', 'Social', 'Team'] as const;
export type MinigameCategory = (typeof MINIGAME_CATEGORIES)[number];

/** Doodle icons a minigame can use for its lobby card (same set as the design sheet). */
export const ICON_NAMES = [
  'pencil', 'bomb', 'crown', 'stopwatch', 'bolt', 'eye', 'chat', 'star', 'target', 'check', 'cross', 'copy',
] as const;
export type IconName = (typeof ICON_NAMES)[number];

// ---------------------------------------------------------------- meta.ts

export interface MinigameMeta {
  /** Shown on the intro splash and lobby card. */
  name: string;
  /** The crayon this minigame owns on its card, splash and results. */
  crayon: Crayon;
  category: MinigameCategory;
  /** Doodle icon on the lobby card. */
  icon: IconName;
  /** One lower-case sentence for the intro splash, under 50 characters. */
  rule: string;
  /** One sentence for the lobby card, under 60 characters. */
  blurb: string;
  /** The minigame is skipped when fewer players are connected. Default 1. */
  minPlayers?: number;
}

/** A minigame as the server announces it to clients: its meta plus its folder name. */
export interface MinigameInfo extends MinigameMeta {
  id: string;
}

/** Identity helper so `meta.ts` gets type checking and autocomplete. */
export function defineMeta(meta: MinigameMeta): MinigameMeta {
  return meta;
}

// ---------------------------------------------------------------- server.ts

/** What a running minigame can do. The room owns the timers and cancels them when the minigame ends. */
export interface MinigameContext<GameEvent> {
  /** Players taking part this round (everyone connected when it started). */
  readonly playerIds: readonly string[];
  /** Name, colour and score of every player in the room. */
  readonly players: readonly PublicPlayer[];
  /** Send an event to every player. */
  emit(event: GameEvent): void;
  /** Send an event to one player. */
  emitTo(playerId: string, event: GameEvent): void;
  /** Run `fn` after `ms`. Cancelled automatically when the minigame ends. */
  setTimeout(fn: () => void, ms: number): void;
  /** Show a countdown in the top bar that ends `ms` from now. */
  setDeadline(ms: number): void;
  /** Finish the minigame and award points per player id. Only the first call counts. */
  end(points: Record<string, number>): void;
}

export interface MinigameInstance<PlayerInput> {
  /** Called once when the minigame begins. Send the first events and start timers here. */
  start(): void;
  /**
   * A player sent input. It comes straight from a browser, so treat every field as untrusted:
   * check `type`, ranges and whether this player is even allowed to act right now.
   */
  onInput(playerId: string, input: PlayerInput): void;
}

export interface ServerMinigame<PlayerInput, GameEvent> {
  /** Safety net: the room ends the minigame with no points if it runs longer than this. */
  maxDurationMs: number;
  /** Called once per round. Keep all round state inside this closure. */
  create(ctx: MinigameContext<GameEvent>): MinigameInstance<PlayerInput>;
}

/** Identity helper so `server.ts` gets type checking for its input and event types. */
export function defineServer<PlayerInput, GameEvent>(
  def: ServerMinigame<PlayerInput, GameEvent>,
): ServerMinigame<PlayerInput, GameEvent> {
  return def;
}

// ---------------------------------------------------------------- client.tsx

export interface MinigameViewProps<PlayerInput, GameEvent> {
  /** Every event this round, oldest first. Derive what to draw from this list. */
  events: GameEvent[];
  me: PublicPlayer;
  players: PublicPlayer[];
  /** 'playing' while live; 'results' once the round is over (show the final state, ignore input). */
  phase: RoomPhase;
  /** Send input to your server.ts `onInput`. */
  send: (input: PlayerInput) => void;
}

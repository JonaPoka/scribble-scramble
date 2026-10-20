import type { MinigameProtocol, PlayableMinigameId, PublicPlayer, RoomPhase } from '@scribble/shared';

export interface MinigameViewProps<K extends PlayableMinigameId> {
  /** This round's events for this minigame, oldest first. */
  events: MinigameProtocol[K]['event'][];
  me: PublicPlayer;
  players: PublicPlayer[];
  /** 'playing' while live, 'results' once the round is over (show the final state, ignore input). */
  phase: RoomPhase;
  send: (input: MinigameProtocol[K]['input']) => void;
}

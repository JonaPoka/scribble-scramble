/** The eight crayons from the design sheet. Also the player colours, in join order. */
export const CRAYONS = ['tomato', 'sky', 'sunny', 'grass', 'grape', 'tangerine', 'bubblegum', 'cocoa'] as const;
export type Crayon = (typeof CRAYONS)[number];

/** Doodle faces, shown only when a player has no drawn character. */
export const AVATAR_FACES = ['smile', 'grin', 'wow', 'smirk', 'dizzy'] as const;
export type AvatarFace = (typeof AVATAR_FACES)[number];

export const MAX_PLAYERS = CRAYONS.length;
export const NAME_MAX_LENGTH = 16;

export interface PublicPlayer {
  id: string;
  name: string;
  color: Crayon;
  score: number;
  connected: boolean;
  isHost: boolean;
}

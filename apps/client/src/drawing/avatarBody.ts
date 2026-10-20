import avatarBodyUrl from '../assets/avatar-body.webp';

/**
 * The body every character is drawn on (src/assets/avatar-body.webp, 640px, transparent).
 * It's shown as an image under the player's strokes, so the eraser can't touch it, and it's
 * never sent over the network. To change it, edit the image; keep the head where it is so
 * faces players already drew still line up.
 */
export const AVATAR_BODY_URL: string = avatarBodyUrl;

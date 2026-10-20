import type { Crayon } from '../players';

export type MinigameCategory = 'Draw' | 'Reflex' | 'Brain' | 'Chaos' | 'Social' | 'Team';

export interface MinigameMeta {
  name: string;
  /** The crayon this minigame owns on its card, splash and results (see the design sheet). */
  crayon: Crayon;
  category: MinigameCategory;
  /** One lower-case sentence for the intro splash, under 50 characters. */
  rule: string;
  /** Longer one-liner for the lobby card, under 60 characters. */
  blurb: string;
}

/**
 * Every minigame in the design. Only the ids listed in `PLAYABLE_MINIGAMES`
 * have a server and client implementation so far.
 */
export const MINIGAMES = {
  'quick-sketch': {
    name: 'Quick Sketch',
    crayon: 'sky',
    category: 'Draw',
    rule: 'one draws, everyone else guesses!',
    blurb: 'One player draws, everyone races to guess in chat.',
  },
  'quick-draw': {
    name: 'Quick Draw',
    crayon: 'tangerine',
    category: 'Reflex',
    rule: 'click when it says GO. not before!',
    blurb: 'Wait for GO, then click first. Too early and you are out.',
  },
  'color-clash': {
    name: 'Color Clash',
    crayon: 'sunny',
    category: 'Brain',
    rule: 'tap the ink colour, not the word!',
    blurb: 'A colour word in the wrong ink. Tap the ink.',
  },
  'hot-potato': {
    name: 'Hot Potato',
    crayon: 'tomato',
    category: 'Chaos',
    rule: 'finish the task to pass the bomb!',
    blurb: 'Finish a micro-task to pass the bomb on.',
  },
  'whack-a-thing': {
    name: 'Whack-a-Thing',
    crayon: 'grass',
    category: 'Reflex',
    rule: 'whack everything that pops up!',
    blurb: 'Targets pop up. Most hits in 20 seconds wins.',
  },
  'closest-guess': {
    name: 'Closest Guess',
    crayon: 'bubblegum',
    category: 'Brain',
    rule: 'closest number wins!',
    blurb: 'How tall is the Eiffel Tower? Closest number wins.',
  },
  'zoom-out': {
    name: 'Zoom Out',
    crayon: 'bubblegum',
    category: 'Brain',
    rule: 'what is it? it zooms out as you guess',
    blurb: 'A super zoomed-in picture. Guess what it is.',
  },
  'impostor-word': {
    name: 'Impostor Word',
    crayon: 'grape',
    category: 'Social',
    rule: 'one of you has a different word…',
    blurb: 'One player has a different word. Find them.',
  },
  'last-one-standing': {
    name: 'Last One Standing',
    crayon: 'grass',
    category: 'Chaos',
    rule: 'dodge everything. stay on the platform!',
    blurb: 'Dodge falling things on a shrinking platform.',
  },
  'memory-sequence': {
    name: 'Memory Sequence',
    crayon: 'grape',
    category: 'Brain',
    rule: 'repeat the pattern. one slip and out!',
    blurb: 'Repeat a growing pattern. One mistake and you are out.',
  },
  'typing-race': {
    name: 'Typing Race',
    crayon: 'sky',
    category: 'Reflex',
    rule: 'type it fast. type it right!',
    blurb: 'Type the sentence fastest. Accuracy earns a bonus.',
  },
  'tug-of-war': {
    name: 'Tug of War',
    crayon: 'tangerine',
    category: 'Team',
    rule: 'mash the button for your team!',
    blurb: 'Two teams, one button, total chaos.',
  },
} as const satisfies Record<string, MinigameMeta>;

export type MinigameId = keyof typeof MINIGAMES;

/** Minigames with a working implementation. Add an id here once both halves exist. */
export const PLAYABLE_MINIGAMES = ['quick-draw', 'color-clash'] as const satisfies readonly MinigameId[];

export type PlayableMinigameId = (typeof PLAYABLE_MINIGAMES)[number];

export function isPlayable(id: MinigameId): id is PlayableMinigameId {
  return (PLAYABLE_MINIGAMES as readonly MinigameId[]).includes(id);
}

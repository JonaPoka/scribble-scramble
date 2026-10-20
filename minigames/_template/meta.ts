// How your minigame looks in the lobby and on its intro splash.
// The folder name is the minigame's id (e.g. minigames/button-mash -> "button-mash").
import { defineMeta } from '@scribble/shared';

export default defineMeta({
  name: 'Button Mash',
  // One of: tomato, sky, sunny, grass, grape, tangerine, bubblegum, cocoa
  crayon: 'grass',
  // One of: Draw, Reflex, Brain, Chaos, Social, Team
  category: 'Reflex',
  // One of: pencil, bomb, crown, stopwatch, bolt, eye, chat, star, target, check, cross, copy
  icon: 'bolt',
  // Shown on the intro splash: one lower-case sentence, under 50 characters.
  rule: 'tap as fast as you can!',
  // Shown on the lobby card: one sentence, under 60 characters.
  blurb: 'Most taps in 10 seconds wins.',
  // The game is skipped in rounds with fewer connected players. Optional, default 1.
  minPlayers: 1,
});

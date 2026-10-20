import { AVATAR_SIZE, type Drawing } from '@scribble/shared';
import { Sketch } from './sketch';

const INK = '#2b1d14';
/** Neutral "blank doll" colour, so players choose skin, clothes and hair themselves. */
const BODY = '#efe9df';

type Pt = [number, number];

/** Points along a quadratic curve from a to b, bending towards c. */
function curve(a: Pt, c: Pt, b: Pt, steps = 10): Pt[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
  });
}

function buildBody(): Drawing {
  const s = new Sketch(AVATAR_SIZE, AVATAR_SIZE);

  // Shoulders, running off the bottom of the picture like a portrait.
  const shoulders: Pt[] = [
    ...curve([36, 270], [42, 206], [96, 194]),
    ...curve([160, 194], [214, 206], [220, 270]),
  ];
  s.fill(shoulders, BODY, 10);
  s.line(curve([36, 270], [42, 206], [96, 194]), INK);
  s.line(curve([160, 194], [214, 206], [220, 270]), INK);
  s.line(curve([96, 194], [128, 202], [160, 194]), INK);

  // Neck.
  s.fill([[110, 150], [146, 150], [148, 198], [108, 198]], BODY, 8);
  s.line([[111, 160], [109, 196]], INK).line([[145, 160], [147, 196]], INK);

  // Ears, then the head over them.
  for (const x of [72, 184]) s.fillEllipse(x, 114, 11, 16, BODY, 7).ellipse(x, 114, 11, 16, INK, 4);
  s.fillEllipse(128, 108, 57, 62, BODY, 10).ellipse(128, 108, 57, 62, INK);

  return s.build();
}

/**
 * The body every character is drawn on. It sits on its own layer under the player's strokes,
 * so it can't be erased, and it isn't sent over the network: every client draws the same one.
 */
export const AVATAR_BODY: Drawing = buildBody();

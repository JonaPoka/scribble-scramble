import { AVATAR_SIZE, type Drawing } from '@scribble/shared';
import { Sketch } from './sketch';

const INK = '#2b1d14';
const WHITE = '#ffffff';
const PINK = '#ff86c2';
const BLUSH = '#ffc2d4';

/** Two shiny eyes: a dark oval with a white highlight. */
function eyes(s: Sketch, y: number, gap: number, rx = 9, ry = 12) {
  for (const x of [128 - gap, 128 + gap]) {
    s.fillEllipse(x, y, rx, ry, INK, 7);
    s.dot(x + rx * 0.35, y - ry * 0.4, WHITE, 5);
  }
}

function cat(): Drawing {
  const s = new Sketch(AVATAR_SIZE, AVATAR_SIZE);
  const orange = '#ff9f1c';
  s.fill([[60, 112], [70, 40], [118, 84]], orange);
  s.fill([[196, 112], [186, 40], [138, 84]], orange);
  s.fill([[78, 92], [80, 62], [102, 82]], PINK, 7);
  s.fill([[178, 92], [176, 62], [154, 82]], PINK, 7);
  s.fillEllipse(128, 146, 78, 66, orange);
  s.line([[62, 116], [70, 40], [118, 82]], INK);
  s.line([[194, 116], [186, 40], [138, 82]], INK);
  s.ellipse(128, 146, 78, 66, INK);
  eyes(s, 136, 30);
  s.fill([[119, 158], [137, 158], [128, 168]], PINK, 6);
  s.line([[128, 168], [121, 178], [110, 175]], INK, 4);
  s.line([[128, 168], [135, 178], [146, 175]], INK, 4);
  s.line([[62, 158], [96, 163]], INK, 3).line([[64, 176], [96, 172]], INK, 3);
  s.line([[194, 158], [160, 163]], INK, 3).line([[192, 176], [160, 172]], INK, 3);
  return s.build();
}

function frog(): Drawing {
  const s = new Sketch(AVATAR_SIZE, AVATAR_SIZE);
  const green = '#63d471';
  s.fillEllipse(84, 100, 30, 30, green);
  s.fillEllipse(172, 100, 30, 30, green);
  s.fillEllipse(128, 156, 92, 60, green);
  s.ellipse(84, 100, 30, 30, INK, 5, Math.PI * 0.8, Math.PI * 2.2);
  s.ellipse(172, 100, 30, 30, INK, 5, Math.PI * 0.8, Math.PI * 2.2);
  s.ellipse(128, 156, 92, 60, INK, 5, Math.PI * -0.12, Math.PI * 1.12);
  s.line([[37, 140], [56, 118]], INK).line([[219, 140], [200, 118]], INK);
  for (const x of [84, 172]) {
    s.fillEllipse(x, 100, 19, 19, WHITE, 8);
    s.ellipse(x, 100, 19, 19, INK, 3);
    s.fillEllipse(x + 3, 103, 8, 8, INK, 6);
  }
  s.ellipse(128, 150, 54, 30, INK, 5, Math.PI * 0.15, Math.PI * 0.85);
  s.fillEllipse(70, 170, 13, 8, BLUSH, 6);
  s.fillEllipse(186, 170, 13, 8, BLUSH, 6);
  return s.build();
}

function ghost(): Drawing {
  const s = new Sketch(AVATAR_SIZE, AVATAR_SIZE);
  const body: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const t = Math.PI + (Math.PI * i) / 24;
    body.push([128 + Math.cos(t) * 70, 118 + Math.sin(t) * 70]);
  }
  s.fill([...body, [198, 196], [58, 196]], WHITE, 10);
  // Outline: the dome, the sides and a wavy hem.
  const hem: [number, number][] = [];
  for (let i = 0; i <= 28; i++) {
    const x = 198 - (140 * i) / 28;
    hem.push([x, 198 + Math.sin((i / 28) * Math.PI * 4) * 9]);
  }
  s.line([[58, 198], ...body, [198, 198], ...hem], INK);
  s.fillEllipse(104, 118, 10, 15, INK, 7).fillEllipse(152, 118, 10, 15, INK, 7);
  s.fillEllipse(128, 156, 10, 13, INK, 6);
  s.fillEllipse(84, 142, 12, 7, BLUSH, 6).fillEllipse(172, 142, 12, 7, BLUSH, 6);
  return s.build();
}

function robot(): Drawing {
  const s = new Sketch(AVATAR_SIZE, AVATAR_SIZE);
  const grey = '#9c958a';
  const head: [number, number][] = [[70, 82], [186, 80], [188, 190], [68, 192]];
  s.line([[128, 81], [127, 52]], INK);
  s.fillEllipse(127, 46, 10, 10, '#ff5d4f', 7).ellipse(127, 46, 10, 10, INK, 4);
  s.fill([[54, 118], [70, 118], [70, 150], [54, 150]], '#ff9f1c', 7);
  s.fill([[186, 118], [202, 118], [202, 150], [186, 150]], '#ff9f1c', 7);
  s.shape([[54, 118], [70, 118], [70, 150], [54, 150]], INK, 4);
  s.shape([[186, 118], [202, 118], [202, 150], [186, 150]], INK, 4);
  s.fill(head, grey, 10).shape(head, INK);
  for (const x of [90, 142]) {
    const eye: [number, number][] = [[x, 108], [x + 26, 108], [x + 26, 134], [x, 134]];
    s.fill(eye, '#4cc4f0', 7).shape(eye, INK, 4).dot(x + 13, 121, INK, 8);
  }
  s.shape([[96, 154], [160, 154], [160, 174], [96, 174]], INK, 4);
  for (const x of [112, 128, 144]) s.line([[x, 155], [x, 173]], INK, 3);
  return s.build();
}

function blob(): Drawing {
  const s = new Sketch(AVATAR_SIZE, AVATAR_SIZE);
  const purple = '#a07bff';
  const sunny = '#ffd23f';
  s.fill([[84, 92], [74, 44], [110, 78]], sunny, 7).line([[84, 92], [74, 44], [110, 78]], INK, 4);
  s.fill([[172, 92], [182, 44], [146, 78]], sunny, 7).line([[172, 92], [182, 44], [146, 78]], INK, 4);
  s.fillEllipse(128, 148, 84, 74, purple).ellipse(128, 148, 84, 74, INK);
  s.fillEllipse(128, 128, 30, 30, WHITE, 8).ellipse(128, 128, 30, 30, INK, 4);
  s.fillEllipse(132, 132, 13, 13, INK, 7).dot(137, 125, WHITE, 5);
  s.ellipse(128, 166, 36, 20, INK, 5, Math.PI * 0.1, Math.PI * 0.9);
  s.fill([[106, 179], [116, 179], [111, 190]], WHITE, 4).fill([[140, 179], [150, 179], [145, 190]], WHITE, 4);
  return s.build();
}

function bunny(): Drawing {
  const s = new Sketch(AVATAR_SIZE, AVATAR_SIZE);
  const fur = '#f6cfa8';
  for (const x of [98, 158]) {
    s.fillEllipse(x, 70, 20, 50, fur);
    s.fillEllipse(x, 74, 8, 34, PINK, 6);
    s.ellipse(x, 70, 20, 50, INK, 5, Math.PI * 0.62, Math.PI * 2.38);
  }
  s.fillEllipse(128, 156, 76, 64, fur).ellipse(128, 156, 76, 64, INK);
  eyes(s, 146, 28, 8, 11);
  s.fillEllipse(128, 166, 9, 6, PINK, 6);
  s.line([[128, 172], [128, 180], [118, 186]], INK, 4).line([[128, 180], [138, 186]], INK, 4);
  s.fillEllipse(80, 174, 13, 8, BLUSH, 6).fillEllipse(176, 174, 13, 8, BLUSH, 6);
  return s.build();
}

export interface CharacterTemplate {
  id: string;
  name: string;
  drawing: Drawing;
}

/** Starting characters players can pick and then change by drawing or erasing. */
export const CHARACTER_TEMPLATES: CharacterTemplate[] = [
  { id: 'cat', name: 'Cat', drawing: cat() },
  { id: 'frog', name: 'Frog', drawing: frog() },
  { id: 'ghost', name: 'Ghost', drawing: ghost() },
  { id: 'robot', name: 'Robot', drawing: robot() },
  { id: 'blob', name: 'Blob', drawing: blob() },
  { id: 'bunny', name: 'Bunny', drawing: bunny() },
];

export function randomTemplate(): CharacterTemplate {
  return CHARACTER_TEMPLATES[Math.floor(Math.random() * CHARACTER_TEMPLATES.length)]!;
}

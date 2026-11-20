import { PipDef, clamp } from '../logic/hydration';
import { Mood, scaleFor } from '../logic/vitality';

export type Shape =
  | { t: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: string; rotation?: number }
  | { t: 'circle'; cx: number; cy: number; r: number; fill: string }
  | { t: 'path'; d: string; fill?: string; stroke?: string; sw?: number };

export interface Look {
  vitality: number; // 0..100
  mood: Mood;
  cheer?: boolean; // forces the happy "goal reached" pose
  blink?: boolean;
  sway?: number; // -1..1 flipper flap phase
}

const INK = '#0B2A3C';
const GREY = '#9AA7B2';
const BEAK = '#FFA63D';
const BEAK_DARK = '#E8832A';

function hex(n: string): [number, number, number] {
  const v = parseInt(n.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
export function mix(a: string, b: string, t: number): string {
  const x = hex(a);
  const y = hex(b);
  const k = clamp(t, 0, 1);
  const c = x.map((p, i) => Math.round(p + (y[i] - p) * k));
  return `#${c.map((p) => p.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Everything drawn for Pip the penguin, in paint order, plus the body scale. Pure, so it can be
 * previewed and tested. Weak Pip is small, thin, grey and droopy; thriving Pip is big, plump,
 * rosy and wears a gold crown.
 */
export function buildPip(def: PipDef, look: Look): { shapes: Shape[]; scale: number } {
  const v = clamp(look.vitality, 0, 100);
  const mood: Mood = look.cheer ? 'thrilled' : look.mood;
  const faded = clamp((50 - v) / 50, 0, 1) * 0.55;
  const coat = mix(def.body, GREY, faded);
  const belly = mix(def.belly, '#F1F5F8', faded);
  const scarf = mix(def.gill, GREY, faded);
  const beak = mix(BEAK, GREY, faded * 0.8);
  const beakDark = mix(BEAK_DARK, GREY, faded * 0.8);
  const droop = clamp((50 - v) / 50, 0, 1);
  const plump = clamp(v / 100, 0, 1); // 0 thin .. 1 plump
  const rx = 50 + plump * 20; // body half-width 50..70
  const asleep = mood === 'sleeping';

  const shapes: Shape[] = [];

  // Feet
  shapes.push({ t: 'ellipse', cx: 72, cy: 186, rx: 21, ry: 8, fill: beak });
  shapes.push({ t: 'ellipse', cx: 128, cy: 186, rx: 21, ry: 8, fill: beak });

  // Flippers: hang down when weak, flap gently when well, shoot up when thrilled.
  const flapBase = mood === 'thrilled' ? -58 : asleep ? 10 : lerp(30, 14, droop) - plump * 6;
  const flap = (look.sway ?? 0) * (mood === 'thrilled' ? 14 : 6) * (1 - droop);
  const fx = rx - 8;
  shapes.push({ t: 'ellipse', cx: 100 - fx, cy: 122, rx: 12, ry: 36, fill: coat, rotation: flapBase + flap });
  shapes.push({ t: 'ellipse', cx: 100 + fx, cy: 122, rx: 12, ry: 36, fill: coat, rotation: -(flapBase - flap) });

  // Body and belly
  shapes.push({ t: 'ellipse', cx: 100, cy: 112, rx, ry: 76, fill: coat });
  shapes.push({ t: 'ellipse', cx: 100, cy: 138, rx: rx - 14, ry: 50, fill: belly });

  // Scarf
  shapes.push({ t: 'ellipse', cx: 100, cy: 112, rx: rx - 12, ry: 9, fill: scarf });
  shapes.push({ t: 'path', d: 'M114 114 h16 v30 q0 8 -8 8 q-8 0 -8 -8 Z', fill: scarf });

  // Cheeks
  if (v >= 55 && !asleep) {
    const blush = mix('#FFFFFF', '#FF8FA3', v >= 80 ? 0.75 : 0.45);
    shapes.push({ t: 'ellipse', cx: 62, cy: 94, rx: 9, ry: 5.5, fill: blush });
    shapes.push({ t: 'ellipse', cx: 138, cy: 94, rx: 9, ry: 5.5, fill: blush });
  }

  // Eyes
  const tired = v < 30 && !asleep && mood !== 'thrilled';
  const lids = tired || mood === 'parched';
  const eye = (cx: number) => {
    const open = !(look.blink && !lids);
    if (open) {
      shapes.push({ t: 'circle', cx, cy: 80, r: 13, fill: '#FFFFFF' });
      shapes.push({ t: 'circle', cx, cy: 82, r: mood === 'thirsty' ? 6 : 7.5, fill: INK });
      shapes.push({ t: 'circle', cx: cx + 2.5, cy: 79, r: 2.4, fill: '#FFFFFF' });
      if (lids) {
        shapes.push({ t: 'path', d: `M${cx - 14} 80 a14 14 0 0 1 28 0 Z`, fill: coat });
        shapes.push({ t: 'path', d: `M${cx - 13} 80 h26`, stroke: INK, sw: 3 });
      }
    } else {
      shapes.push({ t: 'path', d: `M${cx - 11} 82 h22`, stroke: '#FFFFFF', sw: 4.5 });
    }
  };
  const arc = (cx: number, up: boolean) =>
    shapes.push({ t: 'path', d: up ? `M${cx - 11} 82 Q${cx} 68 ${cx + 11} 82` : `M${cx - 11} 78 Q${cx} 90 ${cx + 11} 78`, stroke: '#FFFFFF', sw: 5 });
  if (asleep) {
    arc(78, false);
    arc(122, false);
  } else if (mood === 'thrilled') {
    arc(78, true);
    arc(122, true);
  } else {
    eye(78);
    eye(122);
  }

  // Beak (mouth is the beak): open and cheering, relaxed, flat, or drooping
  if (mood === 'thrilled') {
    shapes.push({ t: 'path', d: 'M86 92 Q100 84 114 92 Q100 118 86 92 Z', fill: beak });
    shapes.push({ t: 'path', d: 'M91 98 Q100 94 109 98 Q100 112 91 98 Z', fill: '#C2403A' });
  } else if (mood === 'parched') {
    shapes.push({ t: 'path', d: 'M88 98 Q100 88 112 98 Q100 106 88 98 Z', fill: beakDark });
  } else {
    shapes.push({ t: 'path', d: 'M87 92 Q100 83 113 92 Q100 108 87 92 Z', fill: beak });
    shapes.push({ t: 'path', d: 'M90 96 Q100 101 110 96', stroke: beakDark, sw: 2.5 });
  }

  // Extras
  if (tired && v < 20) {
    const bag = mix(coat, INK, 0.3);
    shapes.push({ t: 'path', d: 'M66 96 Q78 102 90 96', stroke: bag, sw: 3 });
    shapes.push({ t: 'path', d: 'M110 96 Q122 102 134 96', stroke: bag, sw: 3 });
  }
  if (mood === 'thirsty' || mood === 'parched') {
    const big = mood === 'parched';
    shapes.push({ t: 'path', d: big ? 'M150 56 q-10 15 0 22 q10 -7 0 -22 Z' : 'M150 62 q-8 12 0 18 q8 -6 0 -18 Z', fill: '#7DD3FC' });
  }
  if (asleep) {
    shapes.push({ t: 'path', d: 'M146 38 h16 l-16 16 h16', stroke: '#5B7C99', sw: 4 });
    shapes.push({ t: 'path', d: 'M166 18 h11 l-11 11 h11', stroke: '#5B7C99', sw: 3 });
  }
  if (v >= 80 && !asleep) {
    // gold crown + sparkles
    shapes.push({ t: 'path', d: 'M74 40 L82 16 L92 32 L100 10 L108 32 L118 16 L126 40 Z', fill: '#FFC94A' });
    shapes.push({ t: 'path', d: 'M74 40 h52', stroke: '#E7A31F', sw: 4 });
    shapes.push({ t: 'circle', cx: 100, cy: 14, r: 4, fill: '#FF8FA3' });
    const star = (x: number, y: number, s: number) =>
      shapes.push({ t: 'path', d: `M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z`, fill: '#FFC94A' });
    star(36, 50, 9);
    star(168, 58, 7);
    star(150, 22, 5);
  }
  return { shapes, scale: scaleFor(v) };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

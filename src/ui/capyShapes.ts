import { PipDef as SkinDef, clamp } from '../logic/hydration';
import { Mood, scaleFor } from '../logic/vitality';

export type Shape =
  | { t: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: string; rotation?: number }
  | { t: 'circle'; cx: number; cy: number; r: number; fill: string }
  | { t: 'path'; d: string; fill?: string; stroke?: string; sw?: number };

export interface Look {
  vitality: number; // 0..100
  mood: Mood;
  cheer?: boolean;
  blink?: boolean;
  /** -1..1 ear wiggle phase. */
  sway?: number;
  /** Gear ids worn, see logic/gear.ts. */
  gear?: string[];
}

const INK = '#2B1A12';
const GREY = '#A9A39B';
const NOSE = '#4A2E20';

function hex(n: string): [number, number, number] {
  const v = parseInt(n.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
export function mix(a: string, b: string, t: number): string {
  const x = hex(a);
  const y = hex(b);
  const k = clamp(t, 0, 1);
  return `#${x.map((p, i) => Math.round(p + (y[i] - p) * k).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Everything drawn for the capybara, in paint order, plus the body scale. Pure, so it can be tested.
 * Low vitality: small, pale, droopy. High vitality: big, plump, rosy cheeks and sparkles.
 * `def.body` is the fur, `def.belly` the muzzle/belly, `def.gill` the accent colour (cheeks, nose tint).
 */
export function buildCapy(def: SkinDef, look: Look): { shapes: Shape[]; scale: number } {
  const v = clamp(look.vitality, 0, 100);
  const mood: Mood = look.cheer ? 'thrilled' : look.mood;
  const faded = clamp((50 - v) / 50, 0, 1) * 0.5;
  const fur = mix(def.body, GREY, faded);
  const furDark = mix(fur, '#000000', 0.18);
  const muzzle = mix(def.belly, '#F1EEE9', faded);
  const plump = clamp(v / 100, 0, 1);
  const rx = 62 + plump * 10; // body half-width
  const asleep = mood === 'sleeping';
  const gear = look.gear ?? [];
  const wiggle = (look.sway ?? 0) * 3;
  const shapes: Shape[] = [];

  // Feet
  shapes.push({ t: 'ellipse', cx: 66, cy: 186, rx: 17, ry: 8, fill: furDark });
  shapes.push({ t: 'ellipse', cx: 134, cy: 186, rx: 17, ry: 8, fill: furDark });

  // Body
  shapes.push({ t: 'ellipse', cx: 100, cy: 140, rx, ry: 52, fill: fur });
  shapes.push({ t: 'ellipse', cx: 100, cy: 156, rx: rx - 18, ry: 30, fill: mix(fur, muzzle, 0.35) });
  // Front paws
  shapes.push({ t: 'ellipse', cx: 76, cy: 180, rx: 13, ry: 8, fill: furDark });
  shapes.push({ t: 'ellipse', cx: 124, cy: 180, rx: 13, ry: 8, fill: furDark });

  // Ears (wiggle when live)
  shapes.push({ t: 'ellipse', cx: 56 - wiggle, cy: 50, rx: 11, ry: 9, fill: furDark });
  shapes.push({ t: 'ellipse', cx: 144 + wiggle, cy: 50, rx: 11, ry: 9, fill: furDark });
  shapes.push({ t: 'ellipse', cx: 56 - wiggle, cy: 51, rx: 5.5, ry: 4.5, fill: mix(def.gill, '#FFFFFF', 0.5) });
  shapes.push({ t: 'ellipse', cx: 144 + wiggle, cy: 51, rx: 5.5, ry: 4.5, fill: mix(def.gill, '#FFFFFF', 0.5) });

  // Head: wide, blocky capybara head
  shapes.push({ t: 'path', d: 'M54 78 Q54 44 100 44 Q146 44 146 78 L146 104 Q146 126 100 126 Q54 126 54 104 Z', fill: fur });
  // Muzzle
  shapes.push({ t: 'path', d: 'M70 92 Q70 80 100 80 Q130 80 130 92 L130 108 Q130 124 100 124 Q70 124 70 108 Z', fill: muzzle });
  // Nose and nostrils
  shapes.push({ t: 'path', d: 'M86 88 Q100 80 114 88 Q114 98 100 98 Q86 98 86 88 Z', fill: NOSE });
  shapes.push({ t: 'circle', cx: 94, cy: 90, r: 2, fill: '#1E120C' });
  shapes.push({ t: 'circle', cx: 106, cy: 90, r: 2, fill: '#1E120C' });

  // Cheeks
  if (v >= 50 && !asleep) {
    const blush = mix('#FFFFFF', def.gill, v >= 80 ? 0.8 : 0.5);
    shapes.push({ t: 'ellipse', cx: 68, cy: 100, rx: 9, ry: 6, fill: blush });
    shapes.push({ t: 'ellipse', cx: 132, cy: 100, rx: 9, ry: 6, fill: blush });
  }

  // Eyes
  const tired = v < 30 && !asleep && mood !== 'thrilled';
  const lids = tired || mood === 'parched';
  const eye = (cx: number) => {
    if (look.blink && !lids) {
      shapes.push({ t: 'path', d: `M${cx - 7} 70 h14`, stroke: INK, sw: 3.5 });
      return;
    }
    shapes.push({ t: 'circle', cx, cy: 70, r: 8, fill: INK });
    shapes.push({ t: 'circle', cx: cx + 2.5, cy: 67, r: 2.8, fill: '#FFFFFF' });
    if (lids) shapes.push({ t: 'path', d: `M${cx - 9} 70 a9 9 0 0 1 18 0 Z`, fill: fur });
  };
  const arc = (cx: number, up: boolean) =>
    shapes.push({ t: 'path', d: up ? `M${cx - 9} 74 Q${cx} 60 ${cx + 9} 74` : `M${cx - 9} 68 Q${cx} 78 ${cx + 9} 68`, stroke: INK, sw: 4 });
  if (asleep) {
    arc(76, false);
    arc(124, false);
  } else if (mood === 'thrilled') {
    arc(76, true);
    arc(124, true);
  } else {
    eye(76);
    eye(124);
  }

  // Mouth
  if (mood === 'thrilled') {
    shapes.push({ t: 'path', d: 'M88 106 Q100 122 112 106 Z', fill: '#B5483F' });
  } else if (mood === 'parched' || tired) {
    shapes.push({ t: 'path', d: 'M92 112 Q100 107 108 112', stroke: NOSE, sw: 3 });
  } else {
    shapes.push({ t: 'path', d: 'M91 106 Q100 114 109 106', stroke: NOSE, sw: 3 });
  }

  // Mood extras
  if (mood === 'thirsty' || mood === 'parched') {
    const big = mood === 'parched';
    shapes.push({ t: 'path', d: big ? 'M152 56 q-10 15 0 22 q10 -7 0 -22 Z' : 'M152 62 q-8 12 0 18 q8 -6 0 -18 Z', fill: '#7DD3FC' });
  }
  if (asleep) {
    shapes.push({ t: 'path', d: 'M150 36 h16 l-16 16 h16', stroke: '#5B7C99', sw: 4 });
    shapes.push({ t: 'path', d: 'M170 16 h11 l-11 11 h11', stroke: '#5B7C99', sw: 3 });
  }

  // Gear
  if (gear.includes('sunhat')) {
    shapes.push({ t: 'ellipse', cx: 100, cy: 48, rx: 54, ry: 9, fill: '#F2C14E' });
    shapes.push({ t: 'path', d: 'M72 48 Q72 22 100 22 Q128 22 128 48 Z', fill: '#F7D06B' });
    shapes.push({ t: 'path', d: 'M72 44 h56', stroke: '#E4572E', sw: 4 });
  }
  if (gear.includes('flowers')) {
    const flower = (x: number, c: string) => {
      shapes.push({ t: 'circle', cx: x, cy: 46, r: 7, fill: c });
      shapes.push({ t: 'circle', cx: x, cy: 46, r: 3, fill: '#FFE08A' });
    };
    flower(74, '#FF8FA3');
    flower(100, '#FFB86B');
    flower(126, '#C7A6FF');
  }
  if (gear.includes('shades')) {
    shapes.push({ t: 'path', d: 'M62 62 h32 v12 q0 8 -16 8 q-16 0 -16 -8 Z', fill: '#17202A' });
    shapes.push({ t: 'path', d: 'M106 62 h32 v12 q0 8 -16 8 q-16 0 -16 -8 Z', fill: '#17202A' });
    shapes.push({ t: 'path', d: 'M94 66 h12', stroke: '#17202A', sw: 3 });
  }
  if (gear.includes('scarf')) {
    shapes.push({ t: 'ellipse', cx: 100, cy: 124, rx: 48, ry: 9, fill: '#E4572E' });
    shapes.push({ t: 'path', d: 'M118 126 h16 v26 q0 6 -8 6 q-8 0 -8 -6 Z', fill: '#E4572E' });
  }
  if (gear.includes('bow')) {
    shapes.push({ t: 'path', d: 'M100 130 L80 120 L80 140 Z', fill: '#3B6FD8' });
    shapes.push({ t: 'path', d: 'M100 130 L120 120 L120 140 Z', fill: '#3B6FD8' });
    shapes.push({ t: 'circle', cx: 100, cy: 130, r: 5, fill: '#2A55AE' });
  }
  if (gear.includes('crown') || (v >= 85 && !asleep && !gear.includes('sunhat'))) {
    shapes.push({ t: 'path', d: 'M76 46 L82 22 L92 36 L100 16 L108 36 L118 22 L124 46 Z', fill: '#FFC94A' });
    shapes.push({ t: 'path', d: 'M76 46 h48', stroke: '#E7A31F', sw: 4 });
    shapes.push({ t: 'circle', cx: 100, cy: 20, r: 4, fill: '#FF8FA3' });
  }
  return { shapes, scale: scaleFor(v) };
}

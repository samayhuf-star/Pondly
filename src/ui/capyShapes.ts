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
 * Everything drawn for the bear, in paint order, plus the body scale. Pure, so it can be tested.
 * Low vitality: small, pale, droopy. High vitality: big, plump, rosy cheeks and sparkles.
 * `def.body` is the fur, `def.belly` the muzzle/belly, `def.gill` the accent colour (cheeks, nose tint).
 */
export function buildCapy(def: SkinDef, look: Look): { shapes: Shape[]; scale: number } {
  const v = clamp(look.vitality, 0, 100);
  const mood: Mood = look.cheer ? 'thrilled' : look.mood;
  const faded = clamp((50 - v) / 50, 0, 1) * 0.5;
  const fur = mix(def.body, GREY, faded);
  const furDark = mix(fur, '#000000', 0.2);
  const muzzle = mix(def.belly, '#F1EEE9', faded);
  const plump = clamp(v / 100, 0, 1);
  const rx = 72 + plump * 10; // big, chunky body
  const asleep = mood === 'sleeping';
  const gear = look.gear ?? [];
  const wiggle = (look.sway ?? 0) * 2.5;
  const shapes: Shape[] = [];

  // Feet
  shapes.push({ t: 'ellipse', cx: 62, cy: 188, rx: 20, ry: 9, fill: furDark });
  shapes.push({ t: 'ellipse', cx: 138, cy: 188, rx: 20, ry: 9, fill: furDark });
  // Body, arms, tummy
  shapes.push({ t: 'ellipse', cx: 100, cy: 142, rx, ry: 56, fill: fur });
  shapes.push({ t: 'ellipse', cx: 100, cy: 150, rx: rx - 24, ry: 38, fill: muzzle });
  const armLift = mood === 'thrilled' ? -18 : 0;
  shapes.push({ t: 'ellipse', cx: 36 - wiggle, cy: 144 + armLift, rx: 15, ry: 30, fill: furDark, rotation: mood === 'thrilled' ? -30 : 12 });
  shapes.push({ t: 'ellipse', cx: 164 + wiggle, cy: 144 + armLift, rx: 15, ry: 30, fill: furDark, rotation: mood === 'thrilled' ? 30 : -12 });

  // Round ears
  shapes.push({ t: 'circle', cx: 58, cy: 42, r: 17, fill: fur });
  shapes.push({ t: 'circle', cx: 142, cy: 42, r: 17, fill: fur });
  shapes.push({ t: 'circle', cx: 58, cy: 44, r: 9, fill: mix(def.gill, furDark, 0.35) });
  shapes.push({ t: 'circle', cx: 142, cy: 44, r: 9, fill: mix(def.gill, furDark, 0.35) });

  // Big round head
  shapes.push({ t: 'ellipse', cx: 100, cy: 82, rx: 56, ry: 50, fill: fur });
  // Muzzle
  shapes.push({ t: 'ellipse', cx: 100, cy: 98, rx: 27, ry: 21, fill: muzzle });
  shapes.push({ t: 'path', d: 'M89 88 Q100 80 111 88 Q111 99 100 101 Q89 99 89 88 Z', fill: NOSE });
  shapes.push({ t: 'ellipse', cx: 96, cy: 86, rx: 3, ry: 1.6, fill: '#FFFFFF' });

  // Cheeks
  if (v >= 50 && !asleep) {
    const blush = mix('#FFFFFF', def.gill, v >= 80 ? 0.8 : 0.5);
    shapes.push({ t: 'ellipse', cx: 64, cy: 98, rx: 9, ry: 6, fill: blush });
    shapes.push({ t: 'ellipse', cx: 136, cy: 98, rx: 9, ry: 6, fill: blush });
  }

  // Eyes
  const tired = v < 30 && !asleep && mood !== 'thrilled';
  const lids = tired || mood === 'parched';
  const eye = (cx: number) => {
    if (look.blink && !lids) {
      shapes.push({ t: 'path', d: `M${cx - 7} 72 h14`, stroke: INK, sw: 3.5 });
      return;
    }
    shapes.push({ t: 'circle', cx, cy: 72, r: 8, fill: INK });
    shapes.push({ t: 'circle', cx: cx + 2.5, cy: 69, r: 2.8, fill: '#FFFFFF' });
    if (lids) shapes.push({ t: 'path', d: `M${cx - 9} 72 a9 9 0 0 1 18 0 Z`, fill: fur });
  };
  const arc = (cx: number, up: boolean) =>
    shapes.push({ t: 'path', d: up ? `M${cx - 9} 76 Q${cx} 62 ${cx + 9} 76` : `M${cx - 9} 70 Q${cx} 80 ${cx + 9} 70`, stroke: INK, sw: 4 });
  if (asleep) { arc(76, false); arc(124, false); }
  else if (mood === 'thrilled') { arc(76, true); arc(124, true); }
  else { eye(76); eye(124); }

  // Mouth
  shapes.push({ t: 'path', d: 'M100 101 v5', stroke: NOSE, sw: 3 });
  if (mood === 'thrilled') {
    shapes.push({ t: 'path', d: 'M88 108 Q100 126 112 108 Z', fill: '#B5483F' });
  } else if (mood === 'parched' || tired) {
    shapes.push({ t: 'path', d: 'M92 114 Q100 108 108 114', stroke: NOSE, sw: 3 });
  } else {
    shapes.push({ t: 'path', d: 'M90 108 Q100 117 110 108', stroke: NOSE, sw: 3 });
  }

  if (mood === 'thirsty' || mood === 'parched') {
    const big = mood === 'parched';
    shapes.push({ t: 'path', d: big ? 'M156 58 q-10 15 0 22 q10 -7 0 -22 Z' : 'M156 64 q-8 12 0 18 q8 -6 0 -18 Z', fill: '#7DD3FC' });
  }
  if (asleep) {
    shapes.push({ t: 'path', d: 'M152 30 h16 l-16 16 h16', stroke: '#5B7C99', sw: 4 });
    shapes.push({ t: 'path', d: 'M172 10 h11 l-11 11 h11', stroke: '#5B7C99', sw: 3 });
  }

  // Gear
  if (gear.includes('sunhat')) {
    shapes.push({ t: 'ellipse', cx: 100, cy: 44, rx: 56, ry: 9, fill: '#F2C14E' });
    shapes.push({ t: 'path', d: 'M72 44 Q72 16 100 16 Q128 16 128 44 Z', fill: '#F7D06B' });
    shapes.push({ t: 'path', d: 'M72 40 h56', stroke: '#E4572E', sw: 4 });
  }
  if (gear.includes('flowers')) {
    const flower = (x: number, c: string) => {
      shapes.push({ t: 'circle', cx: x, cy: 40, r: 7, fill: c });
      shapes.push({ t: 'circle', cx: x, cy: 40, r: 3, fill: '#FFE08A' });
    };
    flower(72, '#FF8FA3'); flower(100, '#FFB86B'); flower(128, '#C7A6FF');
  }
  if (gear.includes('shades')) {
    shapes.push({ t: 'path', d: 'M62 64 h32 v12 q0 8 -16 8 q-16 0 -16 -8 Z', fill: '#17202A' });
    shapes.push({ t: 'path', d: 'M106 64 h32 v12 q0 8 -16 8 q-16 0 -16 -8 Z', fill: '#17202A' });
    shapes.push({ t: 'path', d: 'M94 68 h12', stroke: '#17202A', sw: 3 });
  }
  if (gear.includes('scarf')) {
    shapes.push({ t: 'ellipse', cx: 100, cy: 128, rx: 52, ry: 10, fill: '#E4572E' });
    shapes.push({ t: 'path', d: 'M120 130 h16 v28 q0 6 -8 6 q-8 0 -8 -6 Z', fill: '#E4572E' });
  }
  if (gear.includes('bow')) {
    shapes.push({ t: 'path', d: 'M100 130 L80 120 L80 140 Z', fill: '#3B6FD8' });
    shapes.push({ t: 'path', d: 'M100 130 L120 120 L120 140 Z', fill: '#3B6FD8' });
    shapes.push({ t: 'circle', cx: 100, cy: 130, r: 5, fill: '#2A55AE' });
  }
  if (gear.includes('crown') || (v >= 85 && !asleep && !gear.includes('sunhat'))) {
    shapes.push({ t: 'path', d: 'M76 40 L82 16 L92 30 L100 10 L108 30 L118 16 L124 40 Z', fill: '#FFC94A' });
    shapes.push({ t: 'path', d: 'M76 40 h48', stroke: '#E7A31F', sw: 4 });
    shapes.push({ t: 'circle', cx: 100, cy: 14, r: 4, fill: '#FF8FA3' });
  }
  return { shapes, scale: scaleFor(v) };
}

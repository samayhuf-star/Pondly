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
  sway?: number; // -1..1 gill flutter phase
}

const INK = '#0B2A3C';
const GREY = '#9AA7B2';

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

const NORMAL = [-28, -4, 22];
const CHEER = [-48, -24, 2];
const DROOP = [34, 52, 70];
const GILL_POS: [number, number][] = [[40, 70], [30, 94], [40, 118]];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Everything drawn for Pip, in paint order, plus the body scale. Pure, so it can be previewed and tested. */
export function buildPip(def: PipDef, look: Look): { shapes: Shape[]; scale: number } {
  const v = clamp(look.vitality, 0, 100);
  const mood: Mood = look.cheer ? 'thrilled' : look.mood;
  const faded = clamp((50 - v) / 50, 0, 1) * 0.6; // 0 when healthy, up to 0.6 grey when wilted
  const body = mix(def.body, GREY, faded);
  const belly = mix(def.belly, '#EEF2F5', faded);
  const gill = mix(def.gill, '#7C8A96', faded);
  const droop = mood === 'sleeping' ? Math.max(0.5, clamp((50 - v) / 50, 0, 1)) : clamp((50 - v) / 50, 0, 1);
  const perk = mood === 'thrilled' ? 1 : clamp((v - 60) / 40, 0, 1) * 0.5;
  const sway = (look.sway ?? 0) * (1 - droop) * 4;

  const shapes: Shape[] = [];
  const angle = (row: number, side: 1 | -1, i: number) => {
    const open = lerp(NORMAL[row], CHEER[row], perk);
    return side * lerp(open, DROOP[row], droop) + sway * (i % 2 === 0 ? 1 : -1);
  };
  for (let row = 0; row < 3; row++) {
    const [lx, ly] = GILL_POS[row];
    shapes.push({ t: 'ellipse', cx: lx, cy: ly, rx: 28, ry: 8, fill: gill, rotation: angle(row, 1, row) });
    shapes.push({ t: 'ellipse', cx: 200 - lx, cy: ly, rx: 28, ry: 8, fill: gill, rotation: angle(row, -1, row + 1) });
  }
  shapes.push({ t: 'ellipse', cx: 62, cy: 168, rx: 16, ry: 9, fill: body });
  shapes.push({ t: 'ellipse', cx: 138, cy: 168, rx: 16, ry: 9, fill: body });
  shapes.push({ t: 'ellipse', cx: 100, cy: 116, rx: 64, ry: 56, fill: body });
  shapes.push({ t: 'ellipse', cx: 100, cy: 140, rx: 40, ry: 26, fill: belly });

  if (v >= 60 && mood !== 'sleeping') {
    const a = v >= 80 ? 0.9 : 0.55;
    const blush = mix(body, '#FF7A9A', a);
    shapes.push({ t: 'ellipse', cx: 58, cy: 122, rx: 9, ry: 5, fill: blush });
    shapes.push({ t: 'ellipse', cx: 142, cy: 122, rx: 9, ry: 5, fill: blush });
  }

  const tired = v < 30 && mood !== 'sleeping' && mood !== 'thrilled';
  const lids = tired || mood === 'parched';
  const dot = (cx: number, r: number) => {
    shapes.push({ t: 'circle', cx, cy: 104, r, fill: INK });
    if (lids) shapes.push({ t: 'path', d: `M${cx - r - 2} 104 a${r + 2} ${r + 2} 0 0 1 ${2 * (r + 2)} 0 Z`, fill: body });
    if (lids) shapes.push({ t: 'path', d: `M${cx - r - 2} 104 h${2 * (r + 2)}`, stroke: INK, sw: 3 });
  };
  const line = (cx: number) => shapes.push({ t: 'path', d: `M${cx - 8} 104 h16`, stroke: INK, sw: 4.5 });
  const arc = (cx: number, up: boolean) =>
    shapes.push({ t: 'path', d: up ? `M${cx - 8} 104 Q${cx} 96 ${cx + 8} 104` : `M${cx - 8} 104 Q${cx} 112 ${cx + 8} 104`, stroke: INK, sw: 4.5 });

  if (mood === 'sleeping') {
    arc(76, false);
    arc(124, false);
    shapes.push({ t: 'path', d: 'M92 126 Q100 131 108 126', stroke: INK, sw: 4 });
    shapes.push({ t: 'path', d: 'M150 52 h16 l-16 16 h16', stroke: '#5B7C99', sw: 4 });
    shapes.push({ t: 'path', d: 'M168 30 h11 l-11 11 h11', stroke: '#5B7C99', sw: 3 });
  } else if (mood === 'thrilled') {
    arc(76, true);
    arc(124, true);
    shapes.push({ t: 'path', d: 'M86 120 Q100 140 114 120 Z', fill: INK });
  } else {
    const r = mood === 'thirsty' ? 6.5 : 7.5;
    if (look.blink && !lids) {
      line(76);
      line(124);
    } else {
      dot(76, r);
      dot(124, r);
    }
    if (mood === 'parched') shapes.push({ t: 'path', d: 'M89 131 Q100 120 111 131', stroke: INK, sw: 4 });
    else if (mood === 'thirsty') shapes.push({ t: 'path', d: 'M90 128 Q100 124 110 128', stroke: INK, sw: 4 });
    else shapes.push({ t: 'path', d: 'M89 124 Q100 135 111 124', stroke: INK, sw: 4 });
  }

  if (tired && v < 20) {
    shapes.push({ t: 'path', d: 'M68 114 Q76 118 84 114', stroke: mix(body, INK, 0.35), sw: 3 });
    shapes.push({ t: 'path', d: 'M116 114 Q124 118 132 114', stroke: mix(body, INK, 0.35), sw: 3 });
  }
  if (mood === 'thirsty' || mood === 'parched') {
    const big = mood === 'parched';
    shapes.push({ t: 'path', d: big ? 'M154 78 q-9 13 0 19 q9 -6 0 -19 Z' : 'M152 82 q-7 10 0 15 q7 -5 0 -15 Z', fill: '#7DD3FC' });
  }
  if (v >= 80 && mood !== 'sleeping') {
    const star = (x: number, y: number, s: number) =>
      shapes.push({ t: 'path', d: `M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z`, fill: '#FFC94A' });
    star(30, 38, 9);
    star(172, 44, 7);
    star(160, 14, 5);
  }
  return { shapes, scale: scaleFor(v) };
}

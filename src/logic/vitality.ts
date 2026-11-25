import { Log, dayKey, totalMl, clamp } from './hydration';

/**
 * Vitality is how healthy and grown Capy is, 0..100. It is derived entirely from the
 * water log, so it needs no extra storage and old logs work straight away.
 *
 * Each COMPLETED day moves it: goal met grows Capy, a shortfall shrinks Capy, and a day
 * with nothing logged shrinks Capy the most. Today only ever adds (up to +8 as you
 * drink), so Capy never shrinks mid-day; the penalty lands when the day closes.
 */
export const START_VITALITY = 50;
const MAX_LOOKBACK_DAYS = 60;

export type Stage = 'wilted' | 'weak' | 'healthy' | 'strong' | 'thriving';

export interface StageInfo {
  id: Stage;
  label: string;
  min: number;
}

export const STAGES: StageInfo[] = [
  { id: 'wilted', label: 'Wilted', min: 0 },
  { id: 'weak', label: 'Weak', min: 20 },
  { id: 'healthy', label: 'Healthy', min: 40 },
  { id: 'strong', label: 'Strong', min: 60 },
  { id: 'thriving', label: 'Thriving', min: 80 },
];

export function stageFor(vitality: number): StageInfo {
  const v = clamp(vitality, 0, 100);
  let out = STAGES[0];
  for (const s of STAGES) if (v >= s.min) out = s;
  return out;
}

/** Change in vitality for a finished day, from the share of the goal that was drunk. */
export function dayDelta(ratio: number): number {
  if (ratio >= 1) return 8;
  if (ratio >= 0.75) return 3;
  if (ratio >= 0.5) return -3;
  if (ratio >= 0.25) return -8;
  return -12;
}

export interface Vitality {
  /** 0..100, includes today's live progress. */
  value: number;
  /** Vitality at the start of today (all finished days only). */
  base: number;
  /** How much the last finished day changed Capy (negative = shrank). */
  yesterdayDelta: number;
  stage: StageInfo;
}

function parseKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function computeVitality(log: Log, goals: Record<string, number>, fallbackGoal: number, today: Date): Vitality {
  const todayKey = dayKey(today);
  const logged = Object.keys(log).filter((k) => k < todayKey && totalMl(log[k]) > 0).sort();
  const earliest = new Date(today);
  earliest.setHours(0, 0, 0, 0);
  earliest.setDate(earliest.getDate() - MAX_LOOKBACK_DAYS);

  let base = START_VITALITY;
  let yesterdayDelta = 0;
  if (logged.length > 0) {
    let cursor = parseKey(logged[0]);
    if (cursor < earliest) cursor = earliest;
    const end = new Date(today);
    end.setHours(0, 0, 0, 0);
    while (cursor < end) {
      const k = dayKey(cursor);
      const goal = goals[k] ?? fallbackGoal;
      const delta = dayDelta(goal > 0 ? totalMl(log[k]) / goal : 0);
      base = clamp(base + delta, 0, 100);
      yesterdayDelta = delta;
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const goalToday = goals[todayKey] ?? fallbackGoal;
  const ratio = goalToday > 0 ? clamp(totalMl(log[todayKey]) / goalToday, 0, 1) : 0;
  const value = clamp(Math.round(base + ratio * 8), 0, 100);
  return { value, base, yesterdayDelta, stage: stageFor(value) };
}

/** Body size multiplier: a frail Capy is small, a thriving Capy is big. */
export function scaleFor(vitality: number): number {
  return 0.62 + (clamp(vitality, 0, 100) / 100) * 0.5;
}

export type Mood = 'sleeping' | 'thrilled' | 'happy' | 'thirsty' | 'parched';

export interface MoodInput {
  ml: number;
  goalMl: number;
  now: Date;
  wakeHour: number;
  sleepHour: number;
  /** Timestamp (ms) of the latest sip today, if any. */
  lastSipT?: number;
}

export function isAwake(hour: number, wakeHour: number, sleepHour: number): boolean {
  if (wakeHour === sleepHour) return true;
  return wakeHour < sleepHour ? hour >= wakeHour && hour < sleepHour : hour >= wakeHour || hour < sleepHour;
}

/** Fraction of the awake day that has passed, 0..1. */
export function dayElapsed(now: Date, wakeHour: number, sleepHour: number): number {
  const span = (sleepHour - wakeHour + 24) % 24 || 24;
  const h = now.getHours() + now.getMinutes() / 60;
  const since = (h - wakeHour + 24) % 24;
  return clamp(since / span, 0, 1);
}

export function moodFor(i: MoodInput): Mood {
  const ratio = i.goalMl > 0 ? i.ml / i.goalMl : 0;
  if (ratio >= 1) return 'thrilled';
  if (!isAwake(i.now.getHours(), i.wakeHour, i.sleepHour)) return 'sleeping';
  const behind = dayElapsed(i.now, i.wakeHour, i.sleepHour) - ratio;
  const wake = new Date(i.now);
  wake.setHours(i.wakeHour, 0, 0, 0);
  if (wake.getTime() > i.now.getTime()) wake.setDate(wake.getDate() - 1);
  const reference = i.lastSipT ?? wake.getTime();
  const hoursDry = Math.max(0, (i.now.getTime() - reference) / 3_600_000);
  if (behind > 0.35 || hoursDry > 4) return 'parched';
  if (behind > 0.15 || hoursDry > 2.5) return 'thirsty';
  return 'happy';
}

export interface Line {
  title: string;
  hint: string;
}

/** What Capy says and what the person should do, in plain words. */
export function pipLine(name: string, v: Vitality, mood: Mood, mlToGoal: number): Line {
  const left = Math.max(0, Math.round(mlToGoal / 50) * 50).toLocaleString('en-US');
  if (mood === 'thrilled') return { title: `${name} is thriving today`, hint: 'Goal reached. Keep it up tomorrow and Capy keeps growing.' };
  if (mood === 'sleeping') return { title: `${name} is asleep`, hint: 'Resting until your morning. A sip now still counts.' };
  if (mood === 'parched') return { title: `${name} is parched`, hint: `Drink ${left} ml to bring ${name} back.` };
  if (mood === 'thirsty') return { title: `${name} is getting thirsty`, hint: `${left} ml to go. A glass now helps.` };
  if (v.yesterdayDelta < 0) return { title: `${name} shrank yesterday`, hint: `Hit your goal today and ${name} starts growing back.` };
  if (v.stage.id === 'thriving') return { title: `${name} is ${v.stage.label.toLowerCase()}`, hint: `${left} ml to go to stay big and strong.` };
  return { title: `${name} is feeling ${mood === 'happy' ? 'good' : 'okay'}`, hint: `${left} ml to go. Finish the goal and ${name} grows.` };
}

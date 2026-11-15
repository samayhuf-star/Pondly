export type Activity = 'low' | 'moderate' | 'high';

export interface Profile {
  weightKg: number;
  activity: Activity;
  wakeHour: number; // 0-23
  sleepHour: number; // 0-23
}

const ACTIVITY_BONUS: Record<Activity, number> = { low: 0, moderate: 300, high: 600 };

/** Base daily goal in ml: 33 ml per kg plus an activity bonus, rounded to 50, clamped 1500-4500. */
export function baseGoalMl(p: Pick<Profile, 'weightKg' | 'activity'>): number {
  const raw = p.weightKg * 33 + ACTIVITY_BONUS[p.activity];
  return clamp(roundTo(raw, 50), 1500, 4500);
}

export interface ForecastInput {
  baseMl: number;
  tempC: number | null;
  workoutMin: number;
}

export interface Forecast {
  goalMl: number;
  heatMl: number;
  workoutMl: number;
}

/** Heat adds 50 ml per degree above 25C (max 800). Workouts add 10 ml per minute (max 600). */
export function forecastGoal(i: ForecastInput): Forecast {
  const heatMl =
    i.tempC !== null && i.tempC > 25 ? Math.min(800, roundTo((i.tempC - 25) * 50, 50)) : 0;
  const workoutMl = clamp(roundTo(i.workoutMin * 10, 50), 0, 600);
  const goalMl = clamp(roundTo(i.baseMl + heatMl + workoutMl, 50), 1500, 5000);
  return { goalMl, heatMl, workoutMl };
}

/** Evenly spaced reminder hours between wake and sleep (inclusive of wake+1). */
export function reminderHours(wakeHour: number, sleepHour: number, count: number): number[] {
  const span = (sleepHour - wakeHour + 24) % 24 || 24;
  const n = clamp(count, 1, 16);
  const step = span / (n + 1);
  const out: number[] = [];
  for (let k = 1; k <= n; k++) out.push(Math.round(wakeHour + step * k) % 24);
  return Array.from(new Set(out));
}

export function reminderCountFor(goalMl: number): number {
  return clamp(Math.round(goalMl / 300), 6, 12);
}

export interface Entry {
  t: number;
  ml: number;
}
export type Log = Record<string, Entry[]>;

export function dayKey(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function totalMl(entries: Entry[] | undefined): number {
  return (entries ?? []).reduce((a, e) => a + e.ml, 0);
}

/** Streak = consecutive days (ending today, or yesterday if today not yet met) that reached the goal. */
export function currentStreak(log: Log, goals: Record<string, number>, fallbackGoal: number, today: Date): number {
  let streak = 0;
  const cursor = new Date(today);
  const todayKey = dayKey(cursor);
  const goalFor = (k: string) => goals[k] ?? fallbackGoal;
  if (totalMl(log[todayKey]) < goalFor(todayKey)) cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < 3650; i++) {
    const k = dayKey(cursor);
    if (totalMl(log[k]) >= goalFor(k)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

export interface PipDef {
  id: string;
  name: string;
  body: string;
  belly: string;
  gill: string;
  unlock: string;
  needStreak: number;
  needTotalLitres: number;
}

export const PIPS: PipDef[] = [
  { id: 'pip', name: 'Pip', body: '#FF8FA3', belly: '#FFD3DB', gill: '#E8537A', unlock: 'Starter', needStreak: 0, needTotalLitres: 0 },
  { id: 'minty', name: 'Minty', body: '#8FE3CF', belly: '#D5F7EE', gill: '#2FB59B', unlock: '3-day streak', needStreak: 3, needTotalLitres: 0 },
  { id: 'goldie', name: 'Goldie', body: '#FFD26A', belly: '#FFF0C2', gill: '#E7A31F', unlock: '10 litres logged', needStreak: 0, needTotalLitres: 10 },
  { id: 'lilac', name: 'Lilac', body: '#C5B3FF', belly: '#EAE2FF', gill: '#8E75E6', unlock: '7-day streak', needStreak: 7, needTotalLitres: 0 },
  { id: 'midnight', name: 'Midnight', body: '#7FA0D8', belly: '#C9D9F2', gill: '#3F5FA8', unlock: '30-day streak', needStreak: 30, needTotalLitres: 0 },
  { id: 'cloud', name: 'Cloud', body: '#E6EEF5', belly: '#FFFFFF', gill: '#B7C7D6', unlock: '100 litres logged', needStreak: 0, needTotalLitres: 100 },
];

export function unlockedPips(bestStreak: number, lifetimeMl: number): string[] {
  return PIPS.filter(
    (p) => (p.needStreak === 0 && p.needTotalLitres === 0) || (p.needStreak > 0 && bestStreak >= p.needStreak) || (p.needTotalLitres > 0 && lifetimeMl / 1000 >= p.needTotalLitres),
  ).map((p) => p.id);
}

export function lifetimeMl(log: Log): number {
  return Object.values(log).reduce((a, es) => a + totalMl(es), 0);
}

export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}
export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

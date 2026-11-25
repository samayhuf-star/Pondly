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

export interface ReminderTime {
  hour: number;
  minute: number;
}

/**
 * Evenly spaced reminder times strictly between wake and sleep, snapped to 5 minutes.
 * Minute precision keeps the requested count: 12 reminders from 12:00 to 20:00 gives 12 distinct times.
 */
export function reminderTimes(wakeHour: number, sleepHour: number, count: number): ReminderTime[] {
  const spanMin = ((sleepHour - wakeHour + 24) % 24 || 24) * 60;
  const n = clamp(count, 1, 16);
  const step = spanMin / (n + 1);
  const seen = new Set<number>();
  const out: ReminderTime[] = [];
  for (let k = 1; k <= n; k++) {
    const total = (wakeHour * 60 + roundTo(step * k, 5)) % 1440;
    if (seen.has(total)) continue;
    seen.add(total);
    out.push({ hour: Math.floor(total / 60), minute: total % 60 });
  }
  return out;
}

export function formatReminderTime(t: ReminderTime): string {
  return `${t.hour}:${`${t.minute}`.padStart(2, '0')}`;
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

export const SKINS: PipDef[] = [
  { id: 'capy', name: 'Capy', body: '#B07A4F', belly: '#E8CBA6', gill: '#FF9F8A', unlock: 'Starter', needStreak: 0, needTotalLitres: 0 },
  { id: 'mochi', name: 'Mochi', body: '#D9B88F', belly: '#FFF3DD', gill: '#FF8FA3', unlock: '3-day streak', needStreak: 3, needTotalLitres: 0 },
  { id: 'toast', name: 'Toast', body: '#8A5A36', belly: '#E3C29A', gill: '#FFB020', unlock: '10 litres logged', needStreak: 0, needTotalLitres: 10 },
  { id: 'blossom', name: 'Blossom', body: '#C9906E', belly: '#FBE3DA', gill: '#FF6FA0', unlock: '7-day streak', needStreak: 7, needTotalLitres: 0 },
  { id: 'midnight', name: 'Midnight', body: '#5B4636', belly: '#CDBBA8', gill: '#5BB8F5', unlock: '30-day streak', needStreak: 30, needTotalLitres: 0 },
  { id: 'cloud', name: 'Cloud', body: '#B8B2AA', belly: '#F4F1EC', gill: '#9FD6F2', unlock: '100 litres logged', needStreak: 0, needTotalLitres: 100 },
];

export function unlockedSkins(bestStreak: number, lifetimeMl: number): string[] {
  return SKINS.filter(
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

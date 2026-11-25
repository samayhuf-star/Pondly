import { Log, totalMl } from './hydration';

export const GOAL_BONUS_XP = 40;

/** XP for one day: 1 XP per 25 ml up to the goal, plus a bonus for reaching it. */
export function dayXp(ml: number, goalMl: number): number {
  const base = Math.floor(Math.min(ml, goalMl) / 25);
  return base + (goalMl > 0 && ml >= goalMl ? GOAL_BONUS_XP : 0);
}

/** Total XP from the whole water log plus any chest bonus XP. Derived, so old logs earn XP straight away. */
export function totalXp(log: Log, goals: Record<string, number>, baseGoal: number, bonusXp = 0): number {
  let xp = Math.max(0, bonusXp);
  for (const k of Object.keys(log)) xp += dayXp(totalMl(log[k]), goals[k] ?? baseGoal);
  return xp;
}

/** XP needed to reach a level. Level 1 starts at 0, level 2 at 100, level 3 at 400, level 4 at 900. */
export function xpAtLevel(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return 100 * (l - 1) * (l - 1);
}

export interface LevelInfo {
  level: number;
  /** XP earned inside this level. */
  into: number;
  /** XP this level spans. */
  span: number;
  /** 0..1 progress to the next level. */
  pct: number;
}

export function levelFor(xp: number): LevelInfo {
  const x = Math.max(0, Math.floor(xp));
  let level = Math.floor(Math.sqrt(x / 100)) + 1;
  while (xpAtLevel(level + 1) <= x) level += 1;
  while (level > 1 && xpAtLevel(level) > x) level -= 1;
  const lo = xpAtLevel(level);
  const span = xpAtLevel(level + 1) - lo;
  return { level, into: x - lo, span, pct: span > 0 ? (x - lo) / span : 0 };
}

import { baseGoalMl, forecastGoal, reminderHours, reminderCountFor, currentStreak, dayKey, unlockedPips, totalMl } from './hydration';

describe('baseGoalMl', () => {
  it('uses 33 ml per kg rounded to 50', () => {
    expect(baseGoalMl({ weightKg: 70, activity: 'low' })).toBe(2300);
  });
  it('adds activity bonus', () => {
    expect(baseGoalMl({ weightKg: 70, activity: 'high' })).toBe(2900);
  });
  it('clamps extremes', () => {
    expect(baseGoalMl({ weightKg: 20, activity: 'low' })).toBe(1500);
    expect(baseGoalMl({ weightKg: 200, activity: 'high' })).toBe(4500);
  });
});

describe('forecastGoal', () => {
  it('adds nothing at or below 25C', () => {
    expect(forecastGoal({ baseMl: 2400, tempC: 25, workoutMin: 0 }).goalMl).toBe(2400);
  });
  it('adds heat above 25C', () => {
    const f = forecastGoal({ baseMl: 2400, tempC: 33, workoutMin: 0 });
    expect(f.heatMl).toBe(400);
    expect(f.goalMl).toBe(2800);
  });
  it('caps heat at 800 and handles null temperature', () => {
    expect(forecastGoal({ baseMl: 2400, tempC: 60, workoutMin: 0 }).heatMl).toBe(800);
    expect(forecastGoal({ baseMl: 2400, tempC: null, workoutMin: 0 }).heatMl).toBe(0);
  });
  it('adds workout water', () => {
    expect(forecastGoal({ baseMl: 2400, tempC: 20, workoutMin: 30 }).workoutMl).toBe(300);
  });
});

describe('reminderHours', () => {
  it('stays between wake and sleep', () => {
    const h = reminderHours(7, 23, 8);
    expect(h.length).toBeGreaterThan(0);
    h.forEach((x) => { expect(x).toBeGreaterThanOrEqual(7); expect(x).toBeLessThanOrEqual(23); });
  });
  it('handles sleeping after midnight', () => {
    const h = reminderHours(10, 2, 6);
    expect(h.length).toBeGreaterThan(0);
  });
  it('count scales with goal within 6-12', () => {
    expect(reminderCountFor(1500)).toBe(6);
    expect(reminderCountFor(4500)).toBe(12);
  });
});

describe('currentStreak', () => {
  const today = new Date(2026, 10, 15);
  const k = (offset: number) => { const d = new Date(today); d.setDate(d.getDate() - offset); return dayKey(d); };
  it('counts consecutive goal days including today', () => {
    const log = { [k(0)]: [{ t: 0, ml: 2500 }], [k(1)]: [{ t: 0, ml: 2500 }], [k(2)]: [{ t: 0, ml: 1000 }] };
    expect(currentStreak(log, {}, 2400, today)).toBe(2);
  });
  it('keeps yesterday streak while today is still in progress', () => {
    const log = { [k(1)]: [{ t: 0, ml: 2500 }], [k(2)]: [{ t: 0, ml: 2500 }] };
    expect(currentStreak(log, {}, 2400, today)).toBe(2);
  });
  it('is zero with no logs', () => {
    expect(currentStreak({}, {}, 2400, today)).toBe(0);
  });
  it('respects per-day goals', () => {
    const log = { [k(0)]: [{ t: 0, ml: 2600 }] };
    expect(currentStreak(log, { [k(0)]: 2800 }, 2400, today)).toBe(0);
  });
});

describe('pips and totals', () => {
  it('unlocks by streak and litres', () => {
    expect(unlockedPips(0, 0)).toEqual(['pip']);
    expect(unlockedPips(7, 0)).toEqual(['pip', 'minty', 'lilac']);
    expect(unlockedPips(0, 10000)).toContain('goldie');
  });
  it('sums entries', () => {
    expect(totalMl([{ t: 1, ml: 250 }, { t: 2, ml: 500 }])).toBe(750);
    expect(totalMl(undefined)).toBe(0);
  });
});

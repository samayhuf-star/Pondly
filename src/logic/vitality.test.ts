import { computeVitality, dayDelta, stageFor, scaleFor, moodFor, isAwake, START_VITALITY } from './vitality';
import { Log, dayKey } from './hydration';

const GOAL = 2000;
const today = new Date(2026, 10, 19, 12, 0);

function dayAgo(n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return dayKey(d);
}
function logOf(entries: Record<number, number>): Log {
  const log: Log = {};
  for (const [n, ml] of Object.entries(entries)) log[dayAgo(Number(n))] = [{ t: 1, ml }];
  return log;
}

describe('dayDelta', () => {
  it('grows on goal, shrinks on shortfall', () => {
    expect(dayDelta(1)).toBe(8);
    expect(dayDelta(0.8)).toBe(3);
    expect(dayDelta(0.5)).toBe(-3);
    expect(dayDelta(0.3)).toBe(-8);
    expect(dayDelta(0)).toBe(-12);
  });
});

describe('computeVitality', () => {
  it('starts a brand new user at the starting value', () => {
    expect(computeVitality({}, {}, GOAL, today).value).toBe(START_VITALITY);
  });
  it('grows with consecutive goal days', () => {
    const v = computeVitality(logOf({ 3: 2000, 2: 2200, 1: 2000 }), {}, GOAL, today);
    expect(v.base).toBe(START_VITALITY + 24);
    expect(v.yesterdayDelta).toBe(8);
    expect(v.stage.id).toBe('strong');
  });
  it('shrinks when days are missed, including empty days in between', () => {
    const v = computeVitality(logOf({ 4: 2000 }), {}, GOAL, today); // then 3 empty days
    expect(v.base).toBe(START_VITALITY + 8 - 36);
    expect(v.yesterdayDelta).toBe(-12);
  });
  it('never leaves 0..100', () => {
    const low = computeVitality(logOf({ 30: 100 }), {}, GOAL, today);
    expect(low.value).toBeGreaterThanOrEqual(0);
    const hi: Record<number, number> = {};
    for (let i = 1; i <= 40; i++) hi[i] = 2500;
    expect(computeVitality(logOf(hi), {}, GOAL, today).value).toBe(100);
  });
  it("adds today's progress live but never subtracts mid-day", () => {
    const empty = computeVitality({}, {}, GOAL, today);
    const half = computeVitality({ [dayAgo(0)]: [{ t: 1, ml: 1000 }] }, {}, GOAL, today);
    const full = computeVitality({ [dayAgo(0)]: [{ t: 1, ml: 2000 }] }, {}, GOAL, today);
    expect(empty.value).toBe(50);
    expect(half.value).toBe(54);
    expect(full.value).toBe(58);
  });
  it('uses the goal that applied on that day', () => {
    const goals = { [dayAgo(1)]: 4000 };
    expect(computeVitality(logOf({ 1: 2000 }), goals, GOAL, today).yesterdayDelta).toBe(-3);
  });
});

describe('stage and scale', () => {
  it('maps vitality to stages', () => {
    expect(stageFor(0).id).toBe('wilted');
    expect(stageFor(25).id).toBe('weak');
    expect(stageFor(50).id).toBe('healthy');
    expect(stageFor(75).id).toBe('strong');
    expect(stageFor(100).id).toBe('thriving');
  });
  it('is smaller when weak and bigger when thriving', () => {
    expect(scaleFor(0)).toBeLessThan(scaleFor(50));
    expect(scaleFor(50)).toBeLessThan(scaleFor(100));
  });
});

describe('moodFor', () => {
  const base = { goalMl: GOAL, wakeHour: 7, sleepHour: 23 };
  it('is thrilled at the goal', () => {
    expect(moodFor({ ...base, ml: 2000, now: new Date(2026, 10, 19, 10) })).toBe('thrilled');
  });
  it('sleeps outside awake hours', () => {
    expect(moodFor({ ...base, ml: 500, now: new Date(2026, 10, 19, 3) })).toBe('sleeping');
    expect(isAwake(3, 7, 23)).toBe(false);
    expect(isAwake(12, 7, 23)).toBe(true);
  });
  it('is happy when on pace', () => {
    const now = new Date(2026, 10, 19, 15);
    expect(moodFor({ ...base, ml: 1000, now, lastSipT: now.getTime() - 30 * 60_000 })).toBe('happy');
  });
  it('gets thirsty then parched as the day outruns the drinking', () => {
    const now = new Date(2026, 10, 19, 15);
    expect(moodFor({ ...base, ml: 500, now, lastSipT: now.getTime() - 60 * 60_000 })).toBe('thirsty');
    expect(moodFor({ ...base, ml: 0, now: new Date(2026, 10, 19, 19) })).toBe('parched');
  });
  it('gets thirsty after a long dry spell even when ahead', () => {
    const now = new Date(2026, 10, 19, 12);
    expect(moodFor({ ...base, ml: 1000, now, lastSipT: now.getTime() - 3 * 3_600_000 })).toBe('thirsty');
  });
});

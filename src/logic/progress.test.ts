import { dayXp, totalXp, levelFor, xpAtLevel } from './progress';
import { rollChest, GEAR } from './gear';

describe('xp and levels', () => {
  it('earns 1 xp per 25 ml up to the goal, plus a bonus at the goal', () => {
    expect(dayXp(0, 2500)).toBe(0);
    expect(dayXp(1250, 2500)).toBe(50);
    expect(dayXp(2500, 2500)).toBe(140);
    expect(dayXp(4000, 2500)).toBe(140);
  });

  it('adds up the whole log with per-day goals and bonus xp', () => {
    const log = { '2026-11-01': [{ t: 1, ml: 2500 }], '2026-11-02': [{ t: 2, ml: 1000 }] };
    expect(totalXp(log, {}, 2500)).toBe(140 + 40);
    expect(totalXp(log, { '2026-11-02': 1000 }, 2500, 10)).toBe(140 + 40 + 40 + 10);
  });

  it('maps xp to levels with clean boundaries', () => {
    expect(xpAtLevel(1)).toBe(0);
    expect(xpAtLevel(2)).toBe(100);
    expect(xpAtLevel(3)).toBe(400);
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(99).level).toBe(1);
    expect(levelFor(100).level).toBe(2);
    expect(levelFor(399).level).toBe(2);
    expect(levelFor(400).level).toBe(3);
    const info = levelFor(250);
    expect(info.level).toBe(2);
    expect(info.into).toBe(150);
    expect(info.span).toBe(300);
    expect(info.pct).toBeCloseTo(0.5);
  });
});

describe('daily chest', () => {
  it('hands out common gear in order', () => {
    expect(rollChest(1, []).gearId).toBe(GEAR[0].id);
    expect(rollChest(1, [GEAR[0].id]).gearId).toBe(GEAR[1].id);
  });

  it('opens the rare item on a 7-day streak', () => {
    expect(rollChest(7, [GEAR[0].id]).gearId).toBe('crown');
    expect(rollChest(7, [GEAR[0].id]).xp).toBeGreaterThan(rollChest(1, []).xp);
  });

  it('gives bonus xp once everything is owned', () => {
    const all = GEAR.map((g) => g.id);
    expect(rollChest(10, all)).toEqual({ gearId: null, xp: 60 });
  });
});

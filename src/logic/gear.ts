export interface Gear {
  id: string;
  name: string;
  rarity: 'common' | 'rare';
}

/** Order matters: chests hand out the first common item you do not own yet. */
export const GEAR: Gear[] = [
  { id: 'sunhat', name: 'Sunny hat', rarity: 'common' },
  { id: 'flowers', name: 'Flower crown', rarity: 'common' },
  { id: 'shades', name: 'Cool shades', rarity: 'common' },
  { id: 'scarf', name: 'Cozy scarf', rarity: 'common' },
  { id: 'bow', name: 'Bow tie', rarity: 'common' },
  { id: 'crown', name: 'Tiny crown', rarity: 'rare' },
];

export const CHEST_XP = 40;
export const RARE_CHEST_XP = 100;
export const DUPLICATE_CHEST_XP = 60;
export const RARE_STREAK = 7;

export interface ChestResult {
  gearId: string | null;
  xp: number;
}

export function gearById(id: string): Gear | undefined {
  return GEAR.find((g) => g.id === id);
}

/**
 * What today's chest holds. A 7-day streak (or better) opens the rare item first. Otherwise the next common item
 * you do not own. When everything is owned the chest gives bonus XP instead.
 */
export function rollChest(streak: number, owned: string[]): ChestResult {
  if (streak >= RARE_STREAK) {
    const rare = GEAR.find((g) => g.rarity === 'rare' && !owned.includes(g.id));
    if (rare) return { gearId: rare.id, xp: RARE_CHEST_XP };
  }
  const next = GEAR.find((g) => g.rarity === 'common' && !owned.includes(g.id));
  if (next) return { gearId: next.id, xp: CHEST_XP };
  const rare = GEAR.find((g) => g.rarity === 'rare' && !owned.includes(g.id));
  if (rare) return { gearId: rare.id, xp: CHEST_XP };
  return { gearId: null, xp: DUPLICATE_CHEST_XP };
}

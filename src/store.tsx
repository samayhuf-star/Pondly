import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, Log, Profile, baseGoalMl, currentStreak, dayKey, lifetimeMl, unlockedSkins } from './logic/hydration';
import { Vitality, computeVitality } from './logic/vitality';
import { LevelInfo, levelFor, totalXp } from './logic/progress';
import { ChestResult, rollChest } from './logic/gear';

const KEY = 'pondly.state.v1';
const BACKUP_KEY = 'pondly.state.v1.unreadable';

export interface State {
  onboarded: boolean;
  profile: Profile;
  log: Log;
  goals: Record<string, number>; // per-day applied goals
  activePip: string;
  bestStreak: number;
  remindersOn: boolean;
  circleCode: string;
  circleToken: string;
  displayName: string;
  petName: string;
  /** Day keys whose daily chest has been opened. */
  chestsClaimed: string[];
  ownedGear: string[];
  equippedGear: string[];
  /** XP from chests, on top of XP derived from the water log. */
  bonusXp: number;
  /** Answers from the onboarding questions. */
  answers: Record<string, string>;
}

const initial: State = {
  onboarded: false,
  profile: { weightKg: 65, activity: 'moderate' as Activity, wakeHour: 7, sleepHour: 23 },
  log: {},
  goals: {},
  activePip: 'capy',
  bestStreak: 0,
  remindersOn: false,
  circleCode: '',
  circleToken: '',
  displayName: '',
  petName: 'Capy',
  chestsClaimed: [],
  ownedGear: [],
  equippedGear: [],
  bonusXp: 0,
  answers: {},
};

interface Ctx {
  ready: boolean;
  state: State;
  baseGoal: number;
  todayKey: string;
  goalToday: number;
  streak: number;
  vitality: Vitality;
  unlocked: string[];
  xp: number;
  level: LevelInfo;
  /** Goal reached today and the chest not opened yet. */
  chestReady: boolean;
  claimChest: () => ChestResult | null;
  update: (patch: Partial<State>) => void;
  addWater: (ml: number) => void;
  undoLast: () => void;
  setTodayGoal: (ml: number) => void;
  reset: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  // Saving is only allowed once saved data was read successfully (or confirmed absent / safely backed up).
  const canSave = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [todayKey, setTodayKey] = useState(() => dayKey(new Date()));
  const todayRef = useRef(todayKey);
  todayRef.current = todayKey;
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (cancelled) return;
        if (raw) {
          try {
            setState({ ...initial, ...JSON.parse(raw) });
          } catch {
            // Corrupt data: keep a copy of it before anything can overwrite it, then start fresh.
            await AsyncStorage.setItem(BACKUP_KEY, raw);
          }
        }
        canSave.current = true;
        setReady(true);
      } catch {
        // Storage could not be read. Do not save defaults over the real history; retry shortly.
        if (cancelled) return;
        setTimeout(() => !cancelled && setAttempt((n) => n + 1), 2000);
      }
    })();
    return () => { cancelled = true; };
  }, [attempt]);

  useEffect(() => {
    if (ready && canSave.current) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  // Roll the displayed day over at midnight and whenever the app returns to the foreground.
  useEffect(() => {
    const refresh = () => setTodayKey(dayKey(new Date()));
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(() => { refresh(); arm(); }, next.getTime() - now.getTime());
    };
    arm();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') { refresh(); clearTimeout(timer); arm(); }
    });
    return () => { clearTimeout(timer); sub.remove(); };
  }, []);

  const baseGoal = baseGoalMl(state.profile);
  const goalToday = state.goals[todayKey] ?? baseGoal;
  const todayDate = useMemo(() => new Date(`${todayKey}T12:00:00`), [todayKey]);
  const streak = currentStreak(state.log, state.goals, baseGoal, todayDate);
  const vitality = useMemo(() => computeVitality(state.log, state.goals, baseGoal, todayDate), [state.log, state.goals, baseGoal, todayDate]);
  const unlocked = useMemo(() => unlockedSkins(Math.max(state.bestStreak, streak), lifetimeMl(state.log)), [state.bestStreak, streak, state.log]);

  const xp = useMemo(() => totalXp(state.log, state.goals, baseGoal, state.bonusXp), [state.log, state.goals, baseGoal, state.bonusXp]);
  const level = useMemo(() => levelFor(xp), [xp]);
  const todayMl = (state.log[todayKey] ?? []).reduce((a, e) => a + e.ml, 0);
  const chestReady = todayMl >= goalToday && !state.chestsClaimed.includes(todayKey);

  const update = useCallback((patch: Partial<State>) => setState((s) => ({ ...s, ...patch })), []);
  const addWater = useCallback((ml: number) => {
    setState((s) => {
      const k = todayRef.current;
      const entries = [...(s.log[k] ?? []), { t: Date.now(), ml }];
      const log = { ...s.log, [k]: entries };
      const st = currentStreak(log, s.goals, baseGoalMl(s.profile), new Date(`${k}T12:00:00`));
      return { ...s, log, bestStreak: Math.max(s.bestStreak, st) };
    });
  }, []);
  const undoLast = useCallback(() => {
    setState((s) => {
      const k = todayRef.current;
      const entries = (s.log[k] ?? []).slice(0, -1);
      return { ...s, log: { ...s.log, [k]: entries } };
    });
  }, []);
  const setTodayGoal = useCallback((ml: number) => setState((s) => ({ ...s, goals: { ...s.goals, [todayRef.current]: ml } })), []);
  const claimChest = useCallback((): ChestResult | null => {
    const k = todayRef.current;
    const st = stateRef.current;
    const ml = (st.log[k] ?? []).reduce((a, e) => a + e.ml, 0);
    if (st.chestsClaimed.includes(k) || ml < (st.goals[k] ?? baseGoalMl(st.profile))) return null;
    const streakNow = currentStreak(st.log, st.goals, baseGoalMl(st.profile), new Date(`${k}T12:00:00`));
    const result = rollChest(streakNow, st.ownedGear);
    setState((s) => ({
      ...s,
      chestsClaimed: [...s.chestsClaimed, k],
      ownedGear: result.gearId && !s.ownedGear.includes(result.gearId) ? [...s.ownedGear, result.gearId] : s.ownedGear,
      equippedGear: result.gearId && s.equippedGear.length === 0 ? [result.gearId] : s.equippedGear,
      bonusXp: s.bonusXp + result.xp,
    }));
    return result;
  }, []);
  const reset = useCallback(() => { canSave.current = true; setState(initial); AsyncStorage.removeItem(KEY).catch(() => {}); }, []);

  const value: Ctx = { ready, state, baseGoal, todayKey, goalToday, streak, vitality, unlocked, xp, level, chestReady, claimChest, update, addWater, undoLast, setTodayGoal, reset };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}

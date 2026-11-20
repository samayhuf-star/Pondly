import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, Log, Profile, baseGoalMl, currentStreak, dayKey, lifetimeMl, unlockedPips } from './logic/hydration';
import { Vitality, computeVitality } from './logic/vitality';

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
}

const initial: State = {
  onboarded: false,
  profile: { weightKg: 65, activity: 'moderate' as Activity, wakeHour: 7, sleepHour: 23 },
  log: {},
  goals: {},
  activePip: 'pip',
  bestStreak: 0,
  remindersOn: false,
  circleCode: '',
  circleToken: '',
  displayName: '',
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
  const unlocked = useMemo(() => unlockedPips(Math.max(state.bestStreak, streak), lifetimeMl(state.log)), [state.bestStreak, streak, state.log]);

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
  const reset = useCallback(() => { canSave.current = true; setState(initial); AsyncStorage.removeItem(KEY).catch(() => {}); }, []);

  const value: Ctx = { ready, state, baseGoal, todayKey, goalToday, streak, vitality, unlocked, update, addWater, undoLast, setTodayGoal, reset };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}

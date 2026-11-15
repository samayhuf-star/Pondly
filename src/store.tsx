import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, Log, Profile, baseGoalMl, currentStreak, dayKey, lifetimeMl, unlockedPips } from './logic/hydration';

const KEY = 'pondly.state.v1';

export interface State {
  onboarded: boolean;
  profile: Profile;
  log: Log;
  goals: Record<string, number>; // per-day applied goals
  activePip: string;
  bestStreak: number;
  remindersOn: boolean;
}

const initial: State = {
  onboarded: false,
  profile: { weightKg: 65, activity: 'moderate' as Activity, wakeHour: 7, sleepHour: 23 },
  log: {},
  goals: {},
  activePip: 'pip',
  bestStreak: 0,
  remindersOn: false,
};

interface Ctx {
  ready: boolean;
  state: State;
  baseGoal: number;
  goalToday: number;
  streak: number;
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

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => { if (raw) setState({ ...initial, ...JSON.parse(raw) }); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const baseGoal = baseGoalMl(state.profile);
  const todayKey = dayKey(new Date());
  const goalToday = state.goals[todayKey] ?? baseGoal;
  const streak = currentStreak(state.log, state.goals, baseGoal, new Date());
  const unlocked = useMemo(() => unlockedPips(Math.max(state.bestStreak, streak), lifetimeMl(state.log)), [state.bestStreak, streak, state.log]);

  const update = useCallback((patch: Partial<State>) => setState((s) => ({ ...s, ...patch })), []);
  const addWater = useCallback((ml: number) => {
    setState((s) => {
      const k = dayKey(new Date());
      const entries = [...(s.log[k] ?? []), { t: Date.now(), ml }];
      const log = { ...s.log, [k]: entries };
      const st = currentStreak(log, s.goals, baseGoalMl(s.profile), new Date());
      return { ...s, log, bestStreak: Math.max(s.bestStreak, st) };
    });
  }, []);
  const undoLast = useCallback(() => {
    setState((s) => {
      const k = dayKey(new Date());
      const entries = (s.log[k] ?? []).slice(0, -1);
      return { ...s, log: { ...s.log, [k]: entries } };
    });
  }, []);
  const setTodayGoal = useCallback((ml: number) => setState((s) => ({ ...s, goals: { ...s.goals, [dayKey(new Date())]: ml } })), []);
  const reset = useCallback(() => { setState(initial); AsyncStorage.removeItem(KEY).catch(() => {}); }, []);

  const value: Ctx = { ready, state, baseGoal, goalToday, streak, unlocked, update, addWater, undoLast, setTodayGoal, reset };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}

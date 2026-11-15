import * as Crypto from 'expo-crypto';
import { dayKey } from './logic/hydration';

export const CIRCLES_API = 'https://pondly-circles-api-574b78c1.base44.app/api/circles';

export interface CircleView {
  code: string;
  name: string;
  me: string;
  members: { id: string; name: string; pct: number; nudgedByMe: boolean }[];
  nudgedBy: string[];
}

export function newToken(): string {
  return Array.from(Crypto.getRandomBytes(16), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function call(body: Record<string, unknown>): Promise<CircleView | { ok: true }> {
  const res = await fetch(CIRCLES_API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, day: dayKey(new Date()) }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Something went wrong');
  return data;
}

export const createCircle = (circleName: string, displayName: string, token: string) => call({ action: 'create', circleName, displayName, token }) as Promise<CircleView>;
export const joinCircle = (code: string, displayName: string, token: string) => call({ action: 'join', code, displayName, token }) as Promise<CircleView>;
export const syncCircle = (code: string, token: string, pct: number) => call({ action: 'sync', code, token, pct }) as Promise<CircleView>;
export const nudgeMember = (code: string, token: string, toMember: string) => call({ action: 'nudge', code, token, toMember }) as Promise<CircleView>;
export const leaveCircle = (code: string, token: string) => call({ action: 'leave', code, token });

import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { PRO_ENTITLEMENT, REVENUECAT_IOS_KEY, revenueCatConfigured } from './config';

let started = false;

export function initPurchases(): void {
  if (started || !revenueCatConfigured || Platform.OS !== 'ios') return;
  if (__DEV__) void Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: REVENUECAT_IOS_KEY });
  started = true;
  // Apple Search Ads attribution, no user prompt needed.
  void Purchases.enableAdServicesAttributionTokenCollection();
}

/** Keeps the Pro flag in sync when a purchase, renewal, expiry or refund happens outside the paywall. */
export function onProChange(cb: (pro: boolean) => void): () => void {
  if (!started) return () => {};
  const listener = (info: CustomerInfo) => cb(info.entitlements.active[PRO_ENTITLEMENT] !== undefined);
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

/** RevenueCat Customer Center: manage or cancel, refunds, support. */
export async function openCustomerCenter(): Promise<void> {
  if (!started) return;
  try {
    await RevenueCatUI.presentCustomerCenter();
  } catch {
    // Customer Center unavailable in this build.
  }
}

/** Subscriber attributes for RevenueCat audiences, for example goal_ml or reminders_on. */
export function setAttributes(attrs: Record<string, string | null>): void {
  if (!started) return;
  void Purchases.setAttributes(attrs);
}

export async function isPro(): Promise<boolean> {
  if (!started) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[PRO_ENTITLEMENT] !== undefined;
  } catch {
    return false;
  }
}

/** Shows the RevenueCat paywall. Returns 'unavailable' while the placeholder key is in place. */
export async function showPaywall(): Promise<'purchased' | 'cancelled' | 'unavailable'> {
  if (!started) return 'unavailable';
  try {
    const result = await RevenueCatUI.presentPaywall();
    return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED ? 'purchased' : 'cancelled';
  } catch {
    return 'unavailable';
  }
}

export async function restore(): Promise<boolean> {
  if (!started) return false;
  try {
    const info = await Purchases.restorePurchases();
    return info.entitlements.active[PRO_ENTITLEMENT] !== undefined;
  } catch {
    return false;
  }
}

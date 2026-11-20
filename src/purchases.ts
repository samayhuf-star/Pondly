import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { PRO_ENTITLEMENT, REVENUECAT_IOS_KEY, revenueCatConfigured } from './config';

let started = false;

export function initPurchases(): void {
  if (started || Platform.OS !== 'ios') return;
  if (!revenueCatConfigured) {
    if (__DEV__) console.warn('Pondly: EXPO_PUBLIC_REVENUECAT_IOS_KEY is not set; Pro purchases are disabled in this build.');
    return;
  }
  Purchases.configure({ apiKey: REVENUECAT_IOS_KEY });
  started = true;
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

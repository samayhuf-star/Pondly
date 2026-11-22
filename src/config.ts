import { Platform } from 'react-native';

// RevenueCat iOS public SDK key (appl_...). Set EXPO_PUBLIC_RC_IOS_KEY in the EAS production environment
// so the real key is inlined at build time and never checked into source.
export const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
// RevenueCat Android public SDK key (goog_...). Public keys are safe to ship in the app.
export const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? 'goog_GzbuwJlulmzRIRmdSLFHxalWQsU';
export const PRO_ENTITLEMENT = 'pro';
export const PRIVACY_URL = 'https://samayhuf-star.github.io/app-legal/pondly/privacy.html';
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const SUPPORT_EMAIL = 'samayhuf@gmail.com';
export const REVENUECAT_KEY = Platform.OS === 'android' ? REVENUECAT_ANDROID_KEY : REVENUECAT_IOS_KEY;
export const revenueCatConfigured = REVENUECAT_KEY.startsWith('appl_') || REVENUECAT_KEY.startsWith('goog_');

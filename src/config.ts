// RevenueCat iOS public SDK key (appl_...). Set EXPO_PUBLIC_RC_IOS_KEY in the EAS production environment
// so the real key is inlined at build time and never checked into source.
export const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? 'appl_PLACEHOLDER_REPLACE_ME';
export const PRO_ENTITLEMENT = 'pro';
export const PRIVACY_URL = 'https://samayhuf-star.github.io/app-legal/pondly/privacy.html';
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const SUPPORT_EMAIL = 'samayhuf@gmail.com';
export const revenueCatConfigured = REVENUECAT_IOS_KEY.startsWith('appl_') && !REVENUECAT_IOS_KEY.includes('PLACEHOLDER');

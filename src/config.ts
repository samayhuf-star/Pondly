// RevenueCat: set EXPO_PUBLIC_RC_IOS_KEY (appl_...) in the EAS production environment before building.
export const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? 'appl_PLACEHOLDER_REPLACE_ME';
export const PRO_ENTITLEMENT = 'pro';
export const PRIVACY_URL = 'https://samayhuf-star.github.io/app-legal/pondly/privacy.html';
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const SUPPORT_EMAIL = 'samayhuf@gmail.com';
export const revenueCatConfigured = !REVENUECAT_IOS_KEY.includes('PLACEHOLDER');

// RevenueCat iOS public SDK key (appl_...). Set EXPO_PUBLIC_RC_IOS_KEY in the EAS production environment
// so the real key is inlined at build time and never checked into source.
export const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
export const PRO_ENTITLEMENT = 'pro';
// Standard plans (see PRICING.md). All four unlock entitlement `pro` and sit in RevenueCat offering `default`,
// shown with RevenueCat's own paywall. Subscriptions carry a 7-day free trial.
export const PLANS = [
  { id: 'weekly', productId: 'pondly_pro_weekly', rcPackage: '$rc_weekly', price: '$2.99 / week' },
  { id: 'monthly', productId: 'pondly_pro_monthly', rcPackage: '$rc_monthly', price: '$5.99 / month' },
  { id: 'annual', productId: 'pondly_pro_annual', rcPackage: '$rc_annual', price: '$29.99 / year' },
  { id: 'lifetime', productId: 'pondly_pro_lifetime', rcPackage: '$rc_lifetime', price: '$39.99 once' },
] as const;
export const PRIVACY_URL = 'https://samayhuf-star.github.io/app-legal/pondly/privacy.html';
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const SUPPORT_EMAIL = 'samayhuf@gmail.com';
export const revenueCatConfigured = REVENUECAT_IOS_KEY.startsWith('appl_');

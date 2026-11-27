# Pricing (standard plans, 27 Nov 2026; replaces the 17 Nov weekly-only decision)

| Plan | Price | Trial | ASC product | RC package |
|---|---|---|---|---|
| Weekly | $2.99 | 7 days | `pondly_pro_weekly` (auto-renew, 1 week) | `$rc_weekly` |
| Monthly | $5.99 | 7 days | `pondly_pro_monthly` (auto-renew, 1 month) | `$rc_monthly` |
| Annual | $29.99 | 7 days | `pondly_pro_annual` (auto-renew, 1 year) | `$rc_annual` |
| Lifetime | $39.99 | none (one-time) | `pondly_pro_lifetime` (non-consumable) | `$rc_lifetime` |

## Store and RevenueCat setup to match
- App Store Connect: the four products above in one subscription group (lifetime is a non-consumable IAP); intro offer = 1-week free trial on each subscription.
- RevenueCat: entitlement `pro` attached to all four; offering `default` holds the four packages; shown with RevenueCat's own paywall (`presentPaywall`).
- Build env: `EXPO_PUBLIC_RC_IOS_KEY` (RevenueCat iOS public key, `appl_...`) set as an EAS env var for production; the app disables Pro if it is missing.
- Plan IDs also live in `src/config.ts` (`PLANS`).

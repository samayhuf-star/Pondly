# Pricing (standard of 22 Nov 2026, replaces the 17 Nov weekly-only plan)

Plans, all behind a 7-day free trial:

| Plan | Price | Product id |
|---|---|---|
| Weekly | $2.99 | `pondly_pro_weekly` |
| Monthly | $5.99 | `pondly_pro_monthly` |
| Annual | $29.99 | `pondly_pro_annual` |
| Lifetime | $39.99 | `pondly_pro_lifetime` |

## Where each plan shows
- Paywall (right after the 11 onboarding steps): weekly, monthly, annual. Small close button after a few seconds.
- Lifetime: shown only in Settings, and only to people already paying on weekly, monthly or annual.
- Settings: upgrade to any plan.

## Store and RevenueCat setup to match (not done yet)
- RevenueCat: entitlement `pro`; `default` offering with WEEKLY, MONTHLY, ANNUAL packages; a separate `lifetime` offering for Settings; hosted paywall with a delayed close button.
- App Store Connect: auto-renewing subscriptions (one subscription group) for weekly, monthly, annual with a 7-day free-trial introductory offer; lifetime as a non-consumable.
- Google Play (when Android ships): matching base plans and a 7-day free-trial offer.
- Every plan must exist in both stores and be linked in RevenueCat before the app is submitted.

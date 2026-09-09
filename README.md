# IZIRA Microbusiness Platform V1

Brunei-first multi-tenant ordering SaaS for home and micro businesses.

## Current routes
- `/` — product/landing concept
- `/pricing` — launch pricing
- `/signup` — seller registration
- `/login` — seller login
- `/auth/callback` — Supabase email confirmation callback
- `/onboarding` — create business + choose `izira.xyz/[slug]`
- `/dashboard` — live merchant dashboard
- `/dashboard/orders` — merchant order lifecycle + private receipt review
- `/dashboard/plan` — current plan, monthly usage and upgrade request
- `/[slug]` — live merchant storefront
- `/[slug]/order/[token]` — private customer order tracking

## Live backend
- Supabase project: `izira-commerce`
- Region: Singapore (`ap-southeast-1`)
- Auth: Supabase email/password
- Data: businesses, products, orders, order items, payment receipts, preorder campaigns, availability slots
- Storage: private `payment-receipts` bucket
- Checkout: `create-order` Edge Function recalculates totals and enforces plan/order limits server-side
- Receipt upload: `upload-receipt` Edge Function
- Customer tracking: `get-order-status` Edge Function using a private random order token
- Multi-tenancy: `business_id` + Row Level Security
- Supabase security advisor: no current security lints

## Launch plans
### Free — BND 0
- 30 non-cancelled orders per Brunei calendar month
- Unlimited products
- Basic storefront
- Pickup + delivery
- Bank transfer instructions
- Receipt upload
- IZIRA branding remains visible

### Starter — BND 8/month
- 150 non-cancelled orders per Brunei calendar month
- Preorder campaigns
- Availability/capacity slots
- Customer history
- Sales dashboard

### Pro — BND 18/month
- Unlimited orders
- Custom-domain entitlement
- Remove IZIRA branding entitlement
- Advanced preorder controls
- Further exports/analytics/staff features can be added after V1

Annual launch pricing: Starter BND 80/year, Pro BND 180/year.

## Enforcement rules
- Monthly order limits are enforced inside the public `create-order` Edge Function, not only in the UI.
- Preorder campaign and availability-slot INSERT/UPDATE access is restricted by RLS to Starter/Pro/Business plans.
- `custom_domain` can only be set for Pro/Business.
- `hide_izira_branding=true` can only be set for Pro/Business.
- Storefront branding is removed only when the plan and entitlement both allow it.
- Subscription upgrades remain manual during V1; there is no payment gateway.

## Seller flow
1. Seller creates an account.
2. Email confirmation returns to `/auth/callback`.
3. Seller creates a storefront and claims a unique slug.
4. Seller adds products and configures business settings.
5. Starter/Pro sellers can add preorder campaigns and capacity slots.
6. Public customers order through `izira.xyz/[slug]`.
7. Customer transfers payment and uploads a receipt.
8. Seller reviews the private receipt, accepts/rejects payment and moves the order through the lifecycle.
9. Customer can revisit the private tracking URL to see current status.

## Hosting direction
- GitHub remains the source of truth and primary build location.
- Supabase remains the backend/database/auth/storage layer.
- Lovable is the intended hosting/publishing layer.
- Do not create a second Supabase project when connecting the host.

## Safety
Development remains isolated on `feature/microbusiness-platform-v1`. Do not merge to `main` or attach the live `izira.xyz` domain until preview QA is approved.

## Environment
Set these public values in the eventual host environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not commit secret/service-role keys.

# KADAI by IZIRA — Microbusiness Platform V1

KADAI is IZIRA's Brunei-first multi-tenant online commerce/storefront platform for home and micro businesses.

Brand hierarchy: **KADAI** is the customer-facing product. **IZIRA** is the parent company and appears as a subtle endorsement where appropriate.

Core positioning: **Buka kadai online, without the complicated stuff.**
Primary CTA: **Buka Kadai**

## URL architecture
- `/` — IZIRA parent/company website
- `/kadai` — dedicated KADAI acquisition/marketing page
- `/pricing` — KADAI launch pricing
- `/signup` — KADAI seller registration
- `/login` — KADAI seller login
- `/auth/callback` — Supabase email confirmation callback
- `/onboarding` — buka KADAI + choose `izira.xyz/[slug]`
- `/dashboard` — KADAI seller dashboard
- `/dashboard/orders` — merchant order lifecycle + private receipt review
- `/dashboard/plan` — Money & plan, monthly usage and upgrade request
- `/[slug]` — direct merchant storefront such as `izira.xyz/aisyahbakery`
- `/[slug]/order/[token]` — private customer order tracking

Seller storefront URLs intentionally remain at the domain root. Never force `/kadai/[slug]`.

Reserved store slugs include `kadai`, `dashboard`, `login`, `signup`, `pricing`, `about`, `admin`, `api`, `onboarding`, `auth`, `support`, `settings`, `orders`, `products`, `customers`, `checkout`, `terms`, and `privacy`. These are protected in both app validation and the database.

## Brand rules
- Seller business is always the hero on a storefront.
- Free storefront attribution: **Powered by KADAI**.
- Do not show "Powered by KADAI by IZIRA" on seller storefronts.
- `KADAI / by IZIRA` is appropriate on KADAI marketing, authentication, About, Terms, Privacy, and legal/company contexts.
- PWA name/short name is KADAI.
- Dashboard language should stay plain and non-technical.

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
- Powered by KADAI attribution remains visible

### Starter — BND 8/month
- 150 non-cancelled orders per Brunei calendar month
- Preorder campaigns
- Availability/capacity slots
- Customer history
- Sales dashboard

### Pro — BND 18/month
- Unlimited orders
- Custom-domain entitlement
- Remove KADAI attribution entitlement
- Advanced preorder controls
- Further exports/analytics/staff features can be added after V1

Annual launch pricing: Starter BND 80/year, Pro BND 180/year.

## Enforcement rules
- Monthly order limits are enforced inside the public `create-order` Edge Function, not only in the UI.
- Preorder campaign and availability-slot INSERT/UPDATE access is restricted by RLS to Starter/Pro/Business plans.
- `custom_domain` can only be set for Pro/Business.
- Existing database field `hide_izira_branding` is retained for compatibility; in product language it means removing KADAI storefront attribution.
- Storefront attribution is removed only when the plan and entitlement both allow it.
- Subscription upgrades remain manual during V1; there is no payment gateway.

## Seller flow
1. Seller creates a KADAI account.
2. Email confirmation returns to `/auth/callback`.
3. Seller opens their KADAI and claims a unique direct root slug.
4. Seller adds products and configures Pickup & Delivery and payment details.
5. Starter/Pro sellers can create preorders and capacity slots.
6. Public customers order through `izira.xyz/[slug]` without needing a customer account.
7. Customer transfers payment and uploads a receipt.
8. Seller reviews the private receipt, accepts/rejects payment and moves the order through the lifecycle.
9. Customer can revisit the private tracking URL to see current status.

## Product north star
When reviewing any feature or screen, ask:

> Would a small business owner who currently takes orders through Instagram and WhatsApp understand this immediately?

If not, simplify it.

## Hosting direction
- GitHub remains the source of truth and primary build location.
- Supabase remains the backend/database/auth/storage layer.
- Lovable is the intended hosting/publishing layer.
- Do not create or switch to Lovable's separate Cloud database for KADAI application data.
- Do not create another Supabase project.

## Safety
Development remains isolated on `feature/microbusiness-platform-v1`. Do not merge to `main` or attach the live `izira.xyz` domain until preview QA is approved.

## Environment
Set these public values in the eventual host environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not commit secret/service-role keys.

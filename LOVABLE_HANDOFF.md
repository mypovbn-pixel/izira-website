# IZIRA Microbusiness SaaS — Lovable Handoff

## Hosting decision
Lovable is the deployment/hosting target. Vercel is no longer part of this product architecture.

## Source of truth
Keep GitHub as the code/version-history source. Current development branch:
`feature/microbusiness-platform-v1`

Do not merge to `main` or attach the production `izira.xyz` domain until preview QA is approved.

## Existing backend
Use the existing external Supabase project `izira-commerce` (Singapore region). Do not create a second production database.

Existing tables:
- businesses
- products
- orders
- order_items
- payment_receipts

Existing backend behavior:
- Supabase Auth for merchants
- RLS enabled for tenant isolation
- business ownership via `owner_id`
- tenant rows linked by `business_id`
- public storefront data can read active businesses/products
- merchant dashboard can only read/update its own rows
- public checkout uses the `create-order` Edge Function, which recalculates product pricing server-side before inserting an order

## Required public routes
- `/` — platform landing page
- `/:slug` — merchant storefront, e.g. `/aisyahbakery`
- `/signup`
- `/login`
- `/auth/callback`
- `/onboarding`
- `/dashboard`

Reserved slugs include:
`admin`, `login`, `signup`, `dashboard`, `pricing`, `about`, `support`, `api`.

## Customer V1 flow
1. Open merchant link from Instagram/TikTok/WhatsApp.
2. Browse products.
3. Choose quantity and future variants/add-ons.
4. Choose pickup or delivery.
5. Pick available collection/delivery slot.
6. Add optional notes.
7. Checkout.
8. View bank-transfer instructions.
9. Upload receipt.
10. Receive order confirmation.
11. Optional WhatsApp continuation.

## Merchant V1 flow
1. Signup/login.
2. Create business.
3. Claim unique `izira.xyz/[store-slug]` URL.
4. Add/edit/disable products.
5. Configure prices and production/stock limits.
6. Configure preorder windows/cutoffs.
7. Configure pickup/delivery settings and delivery zones/rates.
8. View orders, payment status, order status, calendar, customers, sales and production summaries.
9. Share store link / QR.

## Pricing shown in V1
- Free — BND 0
- Starter — BND 8/month
- Pro — BND 18/month

No sales commission.

Free: limited monthly orders, IZIRA branding visible.
Starter: preorder and production tools.
Pro: unlimited orders, future custom domain, branding removal, advanced automation/staff later.

## Visual system
- IZIRA parent brand
- warm burnt-amber palette
- elegant, minimalist, organized
- premium but approachable
- mobile-first
- avoid crowded decorative motifs
- clear operational UI for home businesses

## Product positioning
Not a generic ecommerce marketplace. It is a business counter for people who sell from home.

Prioritize slot/capacity management, preorder campaigns, manual payment verification, WhatsApp-friendly ordering and operational clarity.

## Avoid in V1
- full accounting suite
- full POS
- marketplace/discovery feed
- logistics fleet
- complex CRM
- unnecessary AI features

## Lovable migration rules
- Use Lovable hosting and preview deployments.
- Connect the existing external Supabase project instead of enabling a duplicate Lovable database.
- Use environment variables for the Supabase URL and publishable key.
- Never place any Supabase secret/service-role key in browser code.
- Preserve tenant RLS; do not weaken policies to make features work.
- Keep GitHub history intact.
- Build and QA on preview first.
- Do not connect `izira.xyz` until preview QA is complete and approved.

## Current preview test merchant
`aisyahbakery`

The existing Supabase database has Aisyah Bakery and four active sample products for end-to-end testing.

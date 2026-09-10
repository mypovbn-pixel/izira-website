# KADAI — Lovable Handoff

## Product and parent brand
KADAI is the product identity. IZIRA is the parent brand.

Use KADAI as the dominant product brand throughout product UI. Use a subtle `by IZIRA` endorsement only on suitable marketing/legal surfaces. Seller storefronts are seller-first; when attribution is required, use `Powered by KADAI`.

Primary CTA: `Buka Kadai`.

## Hosting decision
Lovable is the preview/deployment target. Vercel is not part of this product architecture.

## Source of truth
GitHub is the code/version-history source of truth. Current development branch:
`feature/microbusiness-platform-v1`

Do not merge to `main`, publish the Lovable project, or attach/connect the production `izira.xyz` domain until preview QA is explicitly approved.

## Framework-port rule
The source branch is implemented in Next.js 16. The existing Lovable project uses TanStack Start. Do not blindly replace the Lovable project with the Next.js tree. Port the finished KADAI behavior, routes, visual system and backend contracts into the existing Lovable TanStack structure while preserving GitHub as the authoritative product specification/source.

## Existing backend
Use the existing external Supabase project `izira-commerce` (Singapore region). Do not enable, provision, mirror or duplicate Lovable Cloud database storage for KADAI.

Existing backend behavior includes:
- Supabase Auth for merchants
- RLS tenant isolation
- business ownership via `owner_id`
- tenant rows linked by `business_id`
- public storefront reads limited to public/active data
- merchant dashboard access limited to the merchant's own tenant rows
- server-side order creation/pricing validation
- private order-status tokens
- receipt upload/payment tracking
- plan entitlements and feature gates
- preorder and capacity controls
- appointments and rescheduling protections
- runner/transport workflows
- WhatsApp Business integration/event templates and opt-out handling

Never place a Supabase service-role key or other backend secret in browser code.

## Required routes
- `/` — IZIRA parent/company landing surface
- `/kadai` — dedicated KADAI product landing page
- `/:slug` — seller storefront, e.g. `/aisyahbakery`
- `/:slug/order/:token` — private customer order status
- `/signup`
- `/login`
- `/auth/callback`
- `/onboarding`
- `/dashboard`
- `/dashboard/orders`
- `/dashboard/appointments`
- `/dashboard/transport`
- `/dashboard/whatsapp`
- `/dashboard/plan`
- `/pricing`

## Seller URL model
Preserve the direct seller URL model:
`izira.xyz/{storename}`

Do not move seller storefronts under `/kadai/{storename}`.

## Reserved seller slugs
At minimum reserve:
`kadai`, `dashboard`, `login`, `signup`, `pricing`, `about`, `admin`, `api`, `onboarding`, `auth`, `support`, `settings`, `orders`, `products`, `customers`, `checkout`, `terms`, `privacy`.

The database constraint in the KADAI migrations is authoritative. Do not loosen it in the Lovable port.

## Customer V1 flow
1. Open seller link from Instagram/TikTok/WhatsApp.
2. Browse seller-first storefront.
3. Choose product/service, quantity and available options.
4. Choose pickup, delivery or supported booking flow.
5. Pick an available collection/delivery/appointment slot.
6. Add optional notes.
7. Checkout without requiring a customer account.
8. View bank-transfer instructions where applicable.
9. Upload receipt.
10. Receive order/booking confirmation.
11. Track the order privately by token.
12. Continue on WhatsApp when appropriate.

## Merchant V1 flow
1. Signup/login.
2. Create business.
3. Claim unique `izira.xyz/{store-slug}` URL.
4. Add/edit/disable products or services.
5. Configure prices and production/stock/capacity limits.
6. Configure preorder windows/cutoffs.
7. Configure pickup/delivery settings and supported service/transport workflows.
8. Manage orders, payment review, appointments and transport journeys.
9. Use Today/Needs Attention operational views.
10. Configure WhatsApp Business messaging where enabled.
11. Share store link / QR.

## Pricing shown in current V1
- Free — BND 0
- Starter — BND 10/month or BND 100/year
- Pro — BND 24/month or BND 240/year

No sales commission.

Free includes core selling/booking tools, basic capacity and limited usage, with KADAI attribution.
Starter unlocks higher limits, unlimited preorders and stronger operational tools.
Pro provides unlimited orders and the entitlement for advanced tools, custom-domain support later and KADAI attribution removal where supported.

Preserve the plan gates in code/database rather than re-implementing pricing rules only in the UI.

## Visual system
- KADAI-first product identity
- IZIRA parent endorsement kept subtle
- warm burnt-amber palette
- elegant, minimalist and organized
- premium but approachable
- mobile-first
- clear operational UI for micro/home businesses
- avoid crowded decorative motifs

Seller storefront rule: the seller's own identity is visually dominant. KADAI branding must not compete with the seller brand.

## Product positioning
KADAI is not a generic ecommerce marketplace. It is an online storefront and practical business counter for microbusinesses and small service operators.

Prioritize storefronts, structured orders, manual payment verification, capacity/slots, preorders, appointments, runner/transport operations, WhatsApp-friendly workflows and operational clarity.

## Avoid in V1
- full accounting suite
- full POS
- marketplace/discovery feed
- logistics fleet management beyond the current runner/transport V1
- complex CRM
- speculative/unnecessary AI features

## Lovable migration rules
- Preview only until explicitly approved.
- Keep the existing Lovable project `IZIRA Biz Builder`.
- Use the existing external `izira-commerce` Supabase project only.
- Do not enable Lovable Cloud database for KADAI.
- Preserve RLS and tenant isolation; never weaken security policies to make UI work.
- Preserve plan gates, order/receipt tracking, preorders, capacity/slots, appointments, transport and WhatsApp behavior.
- Mount the KADAI Assistant globally where intended by the source app.
- Replace leftover Lovable starter metadata/branding with KADAI metadata.
- Load the KADAI visual styling consistently across the port.
- Keep seller storefronts seller-first with `Powered by KADAI` only where attribution is required.
- Do not connect or publish `izira.xyz` until explicitly approved.

## Current preview test merchant
`aisyahbakery`

The existing Supabase database has Aisyah Bakery and active sample products for end-to-end preview testing.

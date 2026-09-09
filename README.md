# IZIRA Microbusiness Platform V1

Brunei-first multi-tenant ordering SaaS for home and micro businesses.

## Current routes
- `/` — product/landing concept
- `/signup` — seller registration
- `/login` — seller login
- `/auth/callback` — Supabase email confirmation callback
- `/onboarding` — create business + choose `izira.xyz/[slug]`
- `/dashboard` — live merchant dashboard, orders and product management
- `/aisyahbakery` — live sample storefront backed by Supabase

## Live backend
- Supabase project: `izira-commerce`
- Region: Singapore (`ap-southeast-1`)
- Auth: Supabase email/password
- Data: businesses, products, orders, order items, payment receipts
- Checkout: `create-order` Edge Function recalculates totals server-side
- Multi-tenancy: `business_id` + Row Level Security
- Supabase security advisor: no current security lints

## Seller flow
1. Seller creates an account.
2. Email confirmation returns to `/auth/callback`.
3. Seller creates a storefront and claims a unique slug.
4. Seller adds products and production limits in `/dashboard`.
5. Public customers order through `izira.xyz/[slug]`.
6. Orders appear only in the owning seller's dashboard.

## Safety
Development remains isolated on `feature/microbusiness-platform-v1`. Do not merge to `main` or attach `izira.xyz` until preview QA is approved.

## Local / Vercel environment
Set these variables in `.env.local` locally and later in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not commit secret/service-role keys.

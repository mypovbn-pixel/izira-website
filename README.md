# IZIRA Microbusiness Platform V1

Brunei-first multi-tenant ordering SaaS for home and micro businesses.

## Current preview routes
- `/` — product/landing concept
- `/aisyahbakery` — working sample storefront + cart/checkout demo
- `/dashboard` — merchant dashboard demo

## Architecture
- Next.js App Router
- Vercel hosting target
- Supabase Auth/Postgres/Storage target
- Dynamic store route: `izira.xyz/[slug]`
- Multi-tenancy enforced by `business_id` + Row Level Security

## Safety
Development is isolated on `feature/microbusiness-platform-v1`. Do not merge or attach `izira.xyz` until preview QA is approved.

## Setup
Copy `.env.example` to `.env.local`, add a dedicated Supabase project's URL and publishable key, then run `npm install` and `npm run dev`.

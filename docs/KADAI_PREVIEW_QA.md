# KADAI pre-Lovable QA

Last prepared: 2026-09-10 (Brunei)

## Backend checks completed
- [x] External Supabase `izira-commerce` remains authoritative.
- [x] Core tables present: businesses, products, orders, order_items, payment_receipts, preorder_campaigns, availability_slots, services, appointments.
- [x] Appointment availability tables present: appointment_availability, appointment_blocks.
- [x] RLS policies present for services, appointments, appointment_availability and appointment_blocks.
- [x] Security Advisor returns 0 lints after revoking direct execute on `enforce_free_preorder_limit()`.
- [x] Missing appointments.service_id foreign-key index added.
- [x] create-appointment Edge Function active.
- [x] reschedule-appointment Edge Function active and requires JWT.
- [x] Free preorder server-side limit remains 1 active campaign.
- [x] Free capacity slots are accepted by create-order.

## Appointment functional rules now enforced
- [x] Booking must be at least 5 minutes in the future.
- [x] Optional weekly appointment hours can be configured.
- [x] If hours exist, customer requests outside them are rejected.
- [x] Seller can block leave/lunch/closed periods.
- [x] Service duration must fit inside the available business day.
- [x] Existing bookings prevent overlap.
- [x] Service buffer time is included in conflict checks.
- [x] Merchant rescheduling rechecks hours, blocked periods and booking conflicts.
- [x] Cancelled appointments cannot be rescheduled.
- [x] Reschedule count/timestamp recorded.

## WhatsApp templates prepared
- [x] Order received
- [x] Order payment reminder
- [x] Payment approved
- [x] Receipt rejected
- [x] Order confirmed
- [x] Order ready
- [x] Order thank-you
- [x] Appointment requested
- [x] Appointment confirmed
- [x] Appointment payment reminder
- [x] Appointment reminder
- [x] Appointment rescheduled
- [x] Customer reschedule request
- [x] Appointment cancelled
- [x] Appointment thank-you

All templates use BND where money is shown. These are manual/prefilled WhatsApp actions unless an official WhatsApp Business Platform automation is explicitly configured later.

## Browser / Lovable visual QA still required
- [ ] Mobile 360–430 px: no horizontal scroll.
- [ ] Tablet 768–1024 px.
- [ ] Desktop 1280+ px.
- [ ] Product-only onboarding → dashboard → storefront.
- [ ] Appointment-only onboarding → services → availability → public booking.
- [ ] Both mode shows products and services without confusing navigation.
- [ ] Booking outside hours shows clear error.
- [ ] Booking on blocked time shows clear error.
- [ ] Double-book attempt is rejected.
- [ ] Buffer-time conflict is rejected.
- [ ] Merchant reschedule succeeds to an open time.
- [ ] Merchant reschedule rejects conflict/blocked/out-of-hours time.
- [ ] Cancelled appointment disappears from upcoming workload.
- [ ] WhatsApp buttons open with the expected prefilled copy.
- [ ] All money displays use `BND`.
- [ ] Free storefront shows `Powered by KADAI`.
- [ ] Pro branding-removal entitlement behaves correctly.
- [ ] Free can use basic capacity and exactly 1 active preorder.
- [ ] Starter/Pro plan copy shows BND 10 / BND 24 and annual BND 100 / BND 240.
- [ ] Receipt upload/order status still work after frontend changes.
- [ ] No production publish, DNS change or merge to `main` during QA.

## Known QA limitation
No GitHub CI status checks are configured for the latest branch commit, so this pass verifies repository changes, Supabase schema/security and active Edge Functions, but does not substitute for a real browser/Next.js build. Lovable preview should be used primarily for final visual and interaction QA once credits reset.

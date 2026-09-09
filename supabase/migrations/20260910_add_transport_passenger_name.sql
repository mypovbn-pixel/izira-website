alter table public.appointments add column if not exists passenger_name text;
create index if not exists appointments_business_journey_status_idx on public.appointments(business_id,journey_status) where booking_kind in ('runner','transport');

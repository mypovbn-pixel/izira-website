alter table public.appointments
  add column if not exists journey_status text;

do $$ begin
  alter table public.appointments add constraint appointments_journey_status_check check (journey_status is null or journey_status in ('scheduled','on_the_way','picked_up','dropped_off'));
exception when duplicate_object then null; end $$;

create index if not exists appointments_business_journey_idx on public.appointments(business_id, journey_status, starts_at) where booking_kind in ('runner','transport');

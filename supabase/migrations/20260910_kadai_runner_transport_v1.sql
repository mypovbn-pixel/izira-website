alter table public.services
  add column if not exists service_kind text not null default 'appointment',
  add column if not exists pricing_mode text not null default 'fixed',
  add column if not exists max_passengers integer;

do $$ begin
  alter table public.services add constraint services_service_kind_check check (service_kind in ('appointment','runner','transport'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.services add constraint services_pricing_mode_check check (pricing_mode in ('fixed','quote'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.services add constraint services_max_passengers_check check (max_passengers is null or max_passengers > 0);
exception when duplicate_object then null; end $$;

alter table public.appointments
  add column if not exists booking_kind text not null default 'appointment',
  add column if not exists pickup_location text,
  add column if not exists destination text,
  add column if not exists passenger_count integer,
  add column if not exists item_description text,
  add column if not exists trip_direction text,
  add column if not exists return_at timestamptz,
  add column if not exists series_id uuid,
  add column if not exists recurring_until date,
  add column if not exists recurrence_weekdays integer[],
  add column if not exists quoted_amount numeric;

do $$ begin
  alter table public.appointments add constraint appointments_booking_kind_check check (booking_kind in ('appointment','runner','transport'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.appointments add constraint appointments_passenger_count_check check (passenger_count is null or passenger_count > 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.appointments add constraint appointments_trip_direction_check check (trip_direction is null or trip_direction in ('one_way','return'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.appointments add constraint appointments_quoted_amount_check check (quoted_amount is null or quoted_amount >= 0);
exception when duplicate_object then null; end $$;

alter table public.appointments drop constraint if exists appointments_payment_status_check;
alter table public.appointments add constraint appointments_payment_status_check check (payment_status in ('quote_pending','awaiting_payment','receipt_uploaded','paid','rejected'));

create index if not exists appointments_series_id_idx on public.appointments(series_id) where series_id is not null;
create index if not exists appointments_business_series_idx on public.appointments(business_id, series_id) where series_id is not null;
create index if not exists services_business_kind_idx on public.services(business_id, service_kind, is_active);

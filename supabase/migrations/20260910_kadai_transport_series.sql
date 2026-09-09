create table if not exists public.transport_series (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  booking_kind text not null check (booking_kind in ('runner','transport')),
  pickup_location text not null,
  destination text not null,
  passenger_count integer,
  item_description text,
  trip_direction text check (trip_direction is null or trip_direction in ('one_way','return')),
  first_start timestamptz not null,
  return_at timestamptz,
  recurring_until date not null,
  recurrence_weekdays integer[] not null,
  occurrence_count integer not null check (occurrence_count > 0),
  total numeric not null default 0 check (total >= 0),
  payment_status text not null default 'quote_pending' check (payment_status in ('quote_pending','awaiting_payment','paid','rejected')),
  series_status text not null default 'pending' check (series_status in ('pending','confirmed','completed','cancelled')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.transport_series enable row level security;

drop policy if exists "owners read transport series" on public.transport_series;
create policy "owners read transport series" on public.transport_series for select to authenticated using (exists (select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
drop policy if exists "owners update transport series" on public.transport_series;
create policy "owners update transport series" on public.transport_series for update to authenticated using (exists (select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))) with check (exists (select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
drop policy if exists "owners delete transport series" on public.transport_series;
create policy "owners delete transport series" on public.transport_series for delete to authenticated using (exists (select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));

revoke all on public.transport_series from anon;
grant select,update,delete on public.transport_series to authenticated;
grant all on public.transport_series to service_role;

create index if not exists transport_series_business_start_idx on public.transport_series(business_id, first_start);

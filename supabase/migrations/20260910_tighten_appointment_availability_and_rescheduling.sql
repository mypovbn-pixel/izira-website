alter table public.appointments add column if not exists rescheduled_at timestamptz null;
alter table public.appointments add column if not exists reschedule_count integer not null default 0 check (reschedule_count >= 0);
alter table public.appointments add column if not exists cancelled_at timestamptz null;

create table if not exists public.appointment_availability (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists public.appointment_blocks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists appointment_availability_business_weekday_idx on public.appointment_availability(business_id, weekday) where is_active;
create index if not exists appointment_blocks_business_starts_idx on public.appointment_blocks(business_id, starts_at);
create index if not exists appointments_business_time_idx on public.appointments(business_id, starts_at, ends_at) where appointment_status <> 'cancelled';

alter table public.appointment_availability enable row level security;
alter table public.appointment_blocks enable row level security;

revoke all on table public.appointment_availability from anon;
revoke all on table public.appointment_blocks from anon;
grant select, insert, update, delete on table public.appointment_availability to authenticated;
grant select, insert, update, delete on table public.appointment_blocks to authenticated;

create policy "owners read appointment availability" on public.appointment_availability for select to authenticated using (
  exists (select 1 from public.businesses b where b.id = appointment_availability.business_id and b.owner_id = (select auth.uid()))
);
create policy "owners insert appointment availability" on public.appointment_availability for insert to authenticated with check (
  exists (select 1 from public.businesses b where b.id = appointment_availability.business_id and b.owner_id = (select auth.uid()))
);
create policy "owners update appointment availability" on public.appointment_availability for update to authenticated using (
  exists (select 1 from public.businesses b where b.id = appointment_availability.business_id and b.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.businesses b where b.id = appointment_availability.business_id and b.owner_id = (select auth.uid()))
);
create policy "owners delete appointment availability" on public.appointment_availability for delete to authenticated using (
  exists (select 1 from public.businesses b where b.id = appointment_availability.business_id and b.owner_id = (select auth.uid()))
);

create policy "owners read appointment blocks" on public.appointment_blocks for select to authenticated using (
  exists (select 1 from public.businesses b where b.id = appointment_blocks.business_id and b.owner_id = (select auth.uid()))
);
create policy "owners insert appointment blocks" on public.appointment_blocks for insert to authenticated with check (
  exists (select 1 from public.businesses b where b.id = appointment_blocks.business_id and b.owner_id = (select auth.uid()))
);
create policy "owners update appointment blocks" on public.appointment_blocks for update to authenticated using (
  exists (select 1 from public.businesses b where b.id = appointment_blocks.business_id and b.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.businesses b where b.id = appointment_blocks.business_id and b.owner_id = (select auth.uid()))
);
create policy "owners delete appointment blocks" on public.appointment_blocks for delete to authenticated using (
  exists (select 1 from public.businesses b where b.id = appointment_blocks.business_id and b.owner_id = (select auth.uid()))
);

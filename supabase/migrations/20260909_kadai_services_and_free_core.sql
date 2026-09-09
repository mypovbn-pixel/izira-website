alter table public.businesses
  add column if not exists business_mode text not null default 'products'
  check (business_mode in ('products','appointments','both'));

-- Free sellers can use KADAI's core preorder/capacity features.
drop policy if exists "owners insert campaigns" on public.preorder_campaigns;
create policy "owners insert campaigns" on public.preorder_campaigns
for insert to authenticated
with check (exists (
  select 1 from public.businesses b
  where b.id = preorder_campaigns.business_id and b.owner_id = (select auth.uid())
));

drop policy if exists "owners update campaigns" on public.preorder_campaigns;
create policy "owners update campaigns" on public.preorder_campaigns
for update to authenticated
using (exists (
  select 1 from public.businesses b
  where b.id = preorder_campaigns.business_id and b.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.businesses b
  where b.id = preorder_campaigns.business_id and b.owner_id = (select auth.uid())
));

drop policy if exists "owners insert slots" on public.availability_slots;
create policy "owners insert slots" on public.availability_slots
for insert to authenticated
with check (exists (
  select 1 from public.businesses b
  where b.id = availability_slots.business_id and b.owner_id = (select auth.uid())
));

drop policy if exists "owners update slots" on public.availability_slots;
create policy "owners update slots" on public.availability_slots
for update to authenticated
using (exists (
  select 1 from public.businesses b
  where b.id = availability_slots.business_id and b.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.businesses b
  where b.id = availability_slots.business_id and b.owner_id = (select auth.uid())
));

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  buffer_minutes integer not null default 0 check (buffer_minutes >= 0),
  deposit_amount numeric(12,2) check (deposit_amount is null or deposit_amount >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists services_business_id_idx on public.services(business_id);
alter table public.services enable row level security;

create policy "public read active services" on public.services
for select to anon using (is_active and exists (
  select 1 from public.businesses b where b.id=services.business_id and b.is_active
));
create policy "owners read services" on public.services
for select to authenticated using (exists (
  select 1 from public.businesses b where b.id=services.business_id and b.owner_id=(select auth.uid())
));
create policy "owners insert services" on public.services
for insert to authenticated with check (exists (
  select 1 from public.businesses b where b.id=services.business_id and b.owner_id=(select auth.uid())
));
create policy "owners update services" on public.services
for update to authenticated using (exists (
  select 1 from public.businesses b where b.id=services.business_id and b.owner_id=(select auth.uid())
)) with check (exists (
  select 1 from public.businesses b where b.id=services.business_id and b.owner_id=(select auth.uid())
));
create policy "owners delete services" on public.services
for delete to authenticated using (exists (
  select 1 from public.businesses b where b.id=services.business_id and b.owner_id=(select auth.uid())
));

grant select on public.services to anon;
grant select, insert, update, delete on public.services to authenticated;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text,
  total numeric(12,2) not null default 0 check (total >= 0),
  payment_status text not null default 'awaiting_payment' check (payment_status in ('awaiting_payment','receipt_uploaded','paid','rejected')),
  appointment_status text not null default 'pending' check (appointment_status in ('pending','confirmed','completed','cancelled','no_show')),
  public_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create unique index if not exists appointments_public_token_idx on public.appointments(public_token);
create index if not exists appointments_business_start_idx on public.appointments(business_id, starts_at);
alter table public.appointments enable row level security;

create policy "owners read appointments" on public.appointments
for select to authenticated using (exists (
  select 1 from public.businesses b where b.id=appointments.business_id and b.owner_id=(select auth.uid())
));
create policy "owners insert appointments" on public.appointments
for insert to authenticated with check (exists (
  select 1 from public.businesses b where b.id=appointments.business_id and b.owner_id=(select auth.uid())
));
create policy "owners update appointments" on public.appointments
for update to authenticated using (exists (
  select 1 from public.businesses b where b.id=appointments.business_id and b.owner_id=(select auth.uid())
)) with check (exists (
  select 1 from public.businesses b where b.id=appointments.business_id and b.owner_id=(select auth.uid())
));
create policy "owners delete appointments" on public.appointments
for delete to authenticated using (exists (
  select 1 from public.businesses b where b.id=appointments.business_id and b.owner_id=(select auth.uid())
));

grant select, insert, update, delete on public.appointments to authenticated;

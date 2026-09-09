alter table public.businesses add column if not exists custom_domain text;
alter table public.businesses add column if not exists hide_izira_branding boolean not null default false;

alter table public.businesses drop constraint if exists businesses_custom_domain_plan_check;
alter table public.businesses add constraint businesses_custom_domain_plan_check
  check (custom_domain is null or plan in ('pro','business'));

alter table public.businesses drop constraint if exists businesses_branding_plan_check;
alter table public.businesses add constraint businesses_branding_plan_check
  check (hide_izira_branding = false or plan in ('pro','business'));

-- Preorder campaigns are Starter+.
drop policy if exists "owners insert campaigns" on public.preorder_campaigns;
drop policy if exists "owners update campaigns" on public.preorder_campaigns;
create policy "owners insert campaigns" on public.preorder_campaigns
  for insert to authenticated
  with check (exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.owner_id = (select auth.uid())
      and b.plan in ('starter','pro','business')
  ));
create policy "owners update campaigns" on public.preorder_campaigns
  for update to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.owner_id = (select auth.uid())
      and b.plan in ('starter','pro','business')
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.owner_id = (select auth.uid())
      and b.plan in ('starter','pro','business')
  ));

-- Capacity/availability slots are Starter+.
drop policy if exists "owners insert slots" on public.availability_slots;
drop policy if exists "owners update slots" on public.availability_slots;
create policy "owners insert slots" on public.availability_slots
  for insert to authenticated
  with check (exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.owner_id = (select auth.uid())
      and b.plan in ('starter','pro','business')
  ));
create policy "owners update slots" on public.availability_slots
  for update to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.owner_id = (select auth.uid())
      and b.plan in ('starter','pro','business')
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.owner_id = (select auth.uid())
      and b.plan in ('starter','pro','business')
  ));

-- Monthly order caps are intentionally enforced inside the create-order Edge Function:
-- Free = 30 / Brunei calendar month
-- Starter = 150 / Brunei calendar month
-- Pro/Business = unlimited

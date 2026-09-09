-- Order tracking + receipt review + RLS optimization

alter table public.orders
  add column if not exists public_token uuid not null default gen_random_uuid();

create unique index if not exists orders_public_token_idx
  on public.orders(public_token);

-- Merchants may create short-lived signed URLs only for receipt objects that belong to their business.
drop policy if exists "owners read receipt objects" on storage.objects;
create policy "owners read receipt objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-receipts'
  and exists (
    select 1
    from public.payment_receipts pr
    join public.businesses b on b.id = pr.business_id
    where pr.storage_path = storage.objects.name
      and b.owner_id = (select auth.uid())
  )
);

-- Avoid overlapping permissive SELECT policies while still letting owners see inactive records.
drop policy if exists "owners manage slots" on public.availability_slots;
drop policy if exists "public read active slots" on public.availability_slots;
create policy "public read active slots" on public.availability_slots for select to anon using (is_active);
create policy "owners read slots" on public.availability_slots for select to authenticated using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "owners insert slots" on public.availability_slots for insert to authenticated with check (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "owners update slots" on public.availability_slots for update to authenticated using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))) with check (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "owners delete slots" on public.availability_slots for delete to authenticated using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));

drop policy if exists "owners manage campaigns" on public.preorder_campaigns;
drop policy if exists "public read active campaigns" on public.preorder_campaigns;
create policy "public read active campaigns" on public.preorder_campaigns for select to anon using (is_active);
create policy "owners read campaigns" on public.preorder_campaigns for select to authenticated using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "owners insert campaigns" on public.preorder_campaigns for insert to authenticated with check (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "owners update campaigns" on public.preorder_campaigns for update to authenticated using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))) with check (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy "owners delete campaigns" on public.preorder_campaigns for delete to authenticated using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));

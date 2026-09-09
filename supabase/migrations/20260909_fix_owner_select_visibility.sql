-- Owners must still see their own inactive store and hidden products in the dashboard.
drop policy if exists "public can view active businesses" on public.businesses;
create policy "anon can view active businesses" on public.businesses for select to anon using (is_active);
create policy "authenticated can view active or owned businesses" on public.businesses for select to authenticated using (is_active or owner_id = (select auth.uid()));

drop policy if exists "public can view active products" on public.products;
create policy "anon can view active products" on public.products for select to anon using (is_active and exists(select 1 from public.businesses b where b.id=business_id and b.is_active));
create policy "authenticated can view active or owned products" on public.products for select to authenticated using (
  (is_active and exists(select 1 from public.businesses b where b.id=business_id and b.is_active))
  or exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))
);

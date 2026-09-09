-- Harden table privileges beyond RLS. Public checkout uses Edge Functions with a server key.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

revoke insert, update, delete on public.businesses from anon;
revoke update on public.businesses from authenticated;
grant update (name, slug, description, whatsapp, is_active, bank_name, account_name, account_number, pickup_address, pickup_enabled, delivery_enabled) on public.businesses to authenticated;

revoke insert, update, delete on public.orders from anon;
revoke insert, delete, update on public.orders from authenticated;
grant update (payment_status, order_status) on public.orders to authenticated;

revoke insert, update, delete on public.order_items from anon, authenticated;
revoke insert, update, delete on public.payment_receipts from anon, authenticated;

revoke insert, update, delete on public.products from anon;
revoke insert, update, delete on public.preorder_campaigns from anon;
revoke insert, update, delete on public.availability_slots from anon;

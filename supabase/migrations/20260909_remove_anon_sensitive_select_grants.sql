-- Public storefronts do not need direct access to sensitive order/payment tables.
revoke select on public.orders from anon;
revoke select on public.order_items from anon;
revoke select on public.payment_receipts from anon;

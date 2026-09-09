-- KADAI WhatsApp Business Platform foundation.
-- Access tokens are stored in Supabase Vault and never returned to merchant clients.

create table if not exists public.whatsapp_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  provider text not null default 'meta_cloud_api' check (provider = 'meta_cloud_api'),
  status text not null default 'disconnected' check (status in ('disconnected','connecting','connected','error')),
  waba_id text,
  phone_number_id text,
  display_phone_number text,
  access_token_secret_id uuid,
  connected_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_opt_ins (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_phone text not null,
  purpose text not null default 'transactional' check (purpose in ('transactional','marketing')),
  source text not null default 'checkout',
  opted_in_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id, customer_phone, purpose)
);

create table if not exists public.whatsapp_automations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_key text not null check (event_key in ('order_confirmed','order_ready','appointment_confirmed','appointment_reminder','transport_picked_up','transport_dropped_off','runner_collected','runner_delivered')),
  enabled boolean not null default false,
  template_name text,
  language_code text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, event_key)
);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  connection_id uuid references public.whatsapp_connections(id) on delete set null,
  event_key text,
  recipient text not null,
  message_type text not null default 'template' check (message_type in ('template','text')),
  template_name text,
  language_code text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','sending','sent','delivered','read','failed')),
  meta_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz
);

create table if not exists public.whatsapp_inbound_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  connection_id uuid references public.whatsapp_connections(id) on delete set null,
  meta_message_id text not null unique,
  sender text not null,
  message_type text not null,
  body text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

create index if not exists whatsapp_connections_business_idx on public.whatsapp_connections(business_id);
create index if not exists whatsapp_messages_business_created_idx on public.whatsapp_messages(business_id,created_at desc);
create index if not exists whatsapp_messages_meta_id_idx on public.whatsapp_messages(meta_message_id) where meta_message_id is not null;
create index if not exists whatsapp_messages_connection_id_idx on public.whatsapp_messages(connection_id);
create index if not exists whatsapp_opt_ins_business_phone_idx on public.whatsapp_opt_ins(business_id,customer_phone);
create index if not exists whatsapp_automations_business_event_idx on public.whatsapp_automations(business_id,event_key);
create index if not exists whatsapp_inbound_business_received_idx on public.whatsapp_inbound_messages(business_id,received_at desc);
create index if not exists whatsapp_inbound_connection_id_idx on public.whatsapp_inbound_messages(connection_id);

alter table public.whatsapp_connections enable row level security;
alter table public.whatsapp_opt_ins enable row level security;
alter table public.whatsapp_automations enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.whatsapp_inbound_messages enable row level security;

create policy "owners read whatsapp connection" on public.whatsapp_connections for select to authenticated using (
  exists (select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))
);
create policy "owners read whatsapp opt ins" on public.whatsapp_opt_ins for select to authenticated using (
  exists (select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))
);
create policy "owners manage whatsapp automations" on public.whatsapp_automations for all to authenticated using (
  exists (select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))
) with check (
  exists (select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))
);
create policy "owners read whatsapp messages" on public.whatsapp_messages for select to authenticated using (
  exists (select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))
);
create policy "owners read whatsapp inbound" on public.whatsapp_inbound_messages for select to authenticated using (
  exists (select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))
);

create or replace function public.store_whatsapp_connection_secret(
  p_business_id uuid,
  p_access_token text,
  p_waba_id text,
  p_phone_number_id text,
  p_display_phone_number text default null
) returns uuid
language plpgsql security definer set search_path=public,vault as $$
declare
  v_connection_id uuid;
  v_secret_id uuid;
  v_existing_secret uuid;
  v_plan text;
begin
  select plan into v_plan from public.businesses where id=p_business_id;
  if v_plan is null then raise exception 'Business not found'; end if;
  if v_plan not in ('pro','business') then raise exception 'Official WhatsApp automation requires KADAI Pro'; end if;

  select access_token_secret_id into v_existing_secret from public.whatsapp_connections where business_id=p_business_id;
  if v_existing_secret is null then
    select vault.create_secret(p_access_token,'kadai_whatsapp_'||p_business_id::text||'_'||gen_random_uuid()::text,'KADAI WhatsApp Cloud API token') into v_secret_id;
  else
    perform vault.update_secret(v_existing_secret,p_access_token,null,'KADAI WhatsApp Cloud API token');
    v_secret_id:=v_existing_secret;
  end if;

  insert into public.whatsapp_connections(business_id,status,waba_id,phone_number_id,display_phone_number,access_token_secret_id,connected_at,last_error,updated_at)
  values(p_business_id,'connected',p_waba_id,p_phone_number_id,p_display_phone_number,v_secret_id,now(),null,now())
  on conflict (business_id) do update set status='connected',waba_id=excluded.waba_id,phone_number_id=excluded.phone_number_id,
    display_phone_number=excluded.display_phone_number,access_token_secret_id=excluded.access_token_secret_id,connected_at=now(),last_error=null,updated_at=now()
  returning id into v_connection_id;
  return v_connection_id;
end;
$$;

create or replace function public.get_whatsapp_connection_token(p_connection_id uuid)
returns text language sql security definer set search_path=public,vault as $$
  select ds.decrypted_secret from public.whatsapp_connections c
  join vault.decrypted_secrets ds on ds.id=c.access_token_secret_id
  where c.id=p_connection_id;
$$;

revoke all on function public.store_whatsapp_connection_secret(uuid,text,text,text,text) from public,anon,authenticated;
revoke all on function public.get_whatsapp_connection_token(uuid) from public,anon,authenticated;
grant execute on function public.store_whatsapp_connection_secret(uuid,text,text,text,text) to service_role;
grant execute on function public.get_whatsapp_connection_token(uuid) to service_role;

create or replace function public.disconnect_whatsapp_on_plan_downgrade()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.plan is distinct from new.plan and new.plan not in ('pro','business') then
    update public.whatsapp_connections set status='disconnected',updated_at=now(),last_error='WhatsApp automation requires KADAI Pro' where business_id=new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists businesses_disconnect_whatsapp_on_downgrade on public.businesses;
create trigger businesses_disconnect_whatsapp_on_downgrade after update of plan on public.businesses for each row execute function public.disconnect_whatsapp_on_plan_downgrade();
revoke all on function public.disconnect_whatsapp_on_plan_downgrade() from public,anon,authenticated;

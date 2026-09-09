create or replace function public.enforce_free_preorder_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_count integer;
begin
  if new.is_active is not true then
    return new;
  end if;

  select plan into v_plan from public.businesses where id = new.business_id;
  if v_plan = 'free' then
    select count(*) into v_count
    from public.preorder_campaigns
    where business_id = new.business_id
      and is_active = true
      and id <> coalesce(new.id, gen_random_uuid());

    if v_count >= 1 then
      raise exception 'Free plan allows 1 active preorder campaign at a time';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_free_preorder_limit on public.preorder_campaigns;
create trigger trg_enforce_free_preorder_limit
before insert or update of is_active, business_id on public.preorder_campaigns
for each row execute function public.enforce_free_preorder_limit();

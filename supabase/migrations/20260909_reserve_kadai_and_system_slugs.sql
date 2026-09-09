alter table public.businesses drop constraint if exists businesses_reserved_slug_check;

alter table public.businesses
add constraint businesses_reserved_slug_check
check (
  slug not in (
    'kadai','dashboard','login','signup','pricing','about','admin','api',
    'onboarding','auth','support','settings','orders','products','customers',
    'checkout','terms','privacy'
  )
) not valid;

alter table public.businesses validate constraint businesses_reserved_slug_check;

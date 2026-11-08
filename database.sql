-- =========================================================
-- SHOPY FONT: SAFE, ADDITIVE MARKETPLACE EXTENSION
-- =========================================================
-- Reuses existing profiles, referrals and auth.users.
-- Does not create duplicate member or wallet systems.
-- Does not replace existing authentication triggers.
-- Does not modify ScholarBridge tables.
-- =========================================================

create extension if not exists pgcrypto;

-- 1. MARKETPLACE PRODUCTS
create table if not exists public.sf_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete set null,
  title text not null check (length(trim(title)) between 2 and 150),
  category text not null default 'Other',
  description text not null default '',
  price_usd numeric(12,2) not null check (price_usd > 0),
  image_url text,
  supplier_reference text,
  source_type text not null default 'seller_submission'
    check (source_type in ('seller_submission','authorized_supplier')),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','paused')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

create index if not exists sf_products_status_created_idx
  on public.sf_products(status, created_at desc);

create index if not exists sf_products_category_idx
  on public.sf_products(category);

-- 2. PRODUCT CLICKS
create table if not exists public.sf_product_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.sf_products(id) on delete cascade,
  referrer_id uuid references public.profiles(id) on delete set null,
  referral_code text,
  created_at timestamptz not null default now()
);

create index if not exists sf_product_clicks_product_created_idx
  on public.sf_product_clicks(product_id, created_at desc);

create index if not exists sf_product_clicks_referrer_idx
  on public.sf_product_clicks(referrer_id, created_at desc);

-- 3. PRODUCT SALES
create table if not exists public.sf_product_sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.sf_products(id) on delete restrict,
  referrer_id uuid references public.profiles(id) on delete set null,
  order_reference text not null unique,
  sale_amount_usd numeric(12,2) not null check (sale_amount_usd >= 0),
  status text not null default 'pending'
    check (status in ('pending','verified','rejected','reversed')),
  verified_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists sf_product_sales_status_idx
  on public.sf_product_sales(status, created_at desc);

-- 4. TRACK PRODUCT CLICKS
create or replace function public.sf_track_product_click(
  p_product_id uuid,
  p_referral_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer uuid;
  v_click uuid;
begin
  if not exists (
    select 1 from public.sf_products
    where id = p_product_id and status = 'approved'
  ) then
    raise exception 'Product is not available';
  end if;

  if nullif(trim(p_referral_code), '') is not null then
    select id into v_referrer
    from public.profiles
    where upper(referral_code) = upper(trim(p_referral_code))
    limit 1;
  end if;

  insert into public.sf_product_clicks(
    product_id,
    referrer_id,
    referral_code
  )
  values (
    p_product_id,
    v_referrer,
    nullif(upper(trim(p_referral_code)), '')
  )
  returning id into v_click;

  return v_click;
end;
$$;

-- 5. REGISTER MEMBER REFERRALS
create or replace function public.sf_register_referral(
  p_referral_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer uuid;
  v_user uuid := auth.uid();
begin
  if v_user is null or nullif(trim(p_referral_code), '') is null then
    return false;
  end if;

  select id into v_referrer
  from public.profiles
  where upper(referral_code) = upper(trim(p_referral_code))
  limit 1;

  if v_referrer is null or v_referrer = v_user then
    return false;
  end if;

  update public.profiles
  set referred_by = v_referrer
  where id = v_user and referred_by is null;

  if not exists (
    select 1 from public.referrals
    where referred_user_id = v_user
  ) then
    insert into public.referrals(
      referrer_id,
      referred_user_id,
      status
    )
    values (
      v_referrer,
      v_user,
      'registered'
    )
    on conflict (referred_user_id) do nothing;
  end if;

  return exists (
    select 1 from public.referrals
    where referrer_id = v_referrer
      and referred_user_id = v_user
  );
end;
$$;

-- 6. ENABLE ROW LEVEL SECURITY
alter table public.sf_products enable row level security;
alter table public.sf_product_clicks enable row level security;
alter table public.sf_product_sales enable row level security;

-- 7. PRODUCT POLICIES
drop policy if exists "sf products public approved"
on public.sf_products;

create policy "sf products public approved"
on public.sf_products
for select to anon, authenticated
using (
  status = 'approved'
  or seller_id = auth.uid()
  or public.scf_is_admin()
);

drop policy if exists "sf products seller insert"
on public.sf_products;

create policy "sf products seller insert"
on public.sf_products
for insert to authenticated
with check (
  seller_id = auth.uid()
  and status = 'pending'
  and source_type = 'seller_submission'
);

drop policy if exists "sf products admin insert"
on public.sf_products;

create policy "sf products admin insert"
on public.sf_products
for insert to authenticated
with check (public.scf_is_admin());

drop policy if exists "sf products admin update"
on public.sf_products;

create policy "sf products admin update"
on public.sf_products
for update to authenticated
using (public.scf_is_admin())
with check (public.scf_is_admin());

-- 8. CLICK POLICIES
drop policy if exists "sf clicks admin read"
on public.sf_product_clicks;

create policy "sf clicks admin read"
on public.sf_product_clicks
for select to authenticated
using (public.scf_is_admin());

-- 9. SALES POLICIES
drop policy if exists "sf sales admin manage"
on public.sf_product_sales;

create policy "sf sales admin manage"
on public.sf_product_sales
for all to authenticated
using (public.scf_is_admin())
with check (public.scf_is_admin());

-- 10. PERMISSIONS
revoke all on public.sf_product_clicks from anon, authenticated;

grant select on public.sf_products to anon, authenticated;
grant insert, update on public.sf_products to authenticated;

grant select on public.sf_product_clicks to authenticated;

grant select, insert, update on public.sf_product_sales to authenticated;

grant execute on function
  public.sf_track_product_click(uuid,text)
to anon, authenticated;

grant execute on function
  public.sf_register_referral(text)
to authenticated;

-- =========================================================
-- END OF SHOPY FONT ADDITIVE DATABASE EXTENSION
-- =========================================================


-- =========================================================
-- SHOPY FONT - DATABASE SETUP
-- =========================================================
-- This is an additive database setup.
-- It creates SHOPY FONT tables using the sf_ prefix.
-- It does not intentionally delete existing ScholarBridge
-- tables or records.
--
-- IMPORTANT:
-- 1. Inspect the existing Supabase database first.
-- 2. Back up your database before running this script.
-- 3. Never expose your service_role key in frontend code.
-- 4. Do not run this script until we verify compatibility.
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- 1. MEMBER PROFILES
-- =========================================================

create table if not exists public.sf_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  country text not null default '',
  referral_code text unique not null
    default upper(substr(encode(gen_random_bytes(6),'hex'),1,10)),
  referred_by uuid references public.sf_profiles(id) on delete set null,
  role text not null default 'member'
    check (role in ('member','moderator','admin','super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 2. MARKETPLACE PRODUCTS
-- =========================================================

create table if not exists public.sf_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.sf_profiles(id) on delete set null,
  title text not null,
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
  reviewed_by uuid references public.sf_profiles(id)
);

-- =========================================================
-- 3. REFERRALS
-- =========================================================

create table if not exists public.sf_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.sf_profiles(id) on delete cascade,
  referred_user_id uuid not null unique references public.sf_profiles(id) on delete cascade,
  status text not null default 'registered'
    check (status in ('registered','verified','rejected')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

-- =========================================================
-- 4. MEMBER PAYMENTS
-- =========================================================

create table if not exists public.sf_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.sf_profiles(id) on delete cascade,
  package_amount_kes numeric(12,2) not null
    check (package_amount_kes in (580,1000,1500,2000)),
  currency text not null default 'KES',
  payment_reference text unique,
  provider text,
  status text not null default 'pending'
    check (status in ('pending','verified','failed','reversed')),
  verified_by uuid references public.sf_profiles(id),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

-- =========================================================
-- 5. WALLET LEDGER
-- =========================================================

create table if not exists public.sf_wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.sf_profiles(id) on delete cascade,
  entry_type text not null
    check (entry_type in ('referral_commission','adjustment','reversal')),
  amount_usd numeric(12,2) not null,
  currency text not null default 'USD',
  source_payment_id uuid references public.sf_payments(id),
  description text not null default '',
  created_at timestamptz not null default now(),
  unique(user_id, source_payment_id, entry_type)
);

-- =========================================================
-- 6. REFERRAL COMMISSIONS
-- =========================================================

create table if not exists public.sf_referral_commissions (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.sf_profiles(id) on delete cascade,
  referred_user_id uuid not null references public.sf_profiles(id) on delete cascade,
  payment_id uuid not null unique references public.sf_payments(id) on delete cascade,
  commission_rate numeric(5,4) not null default 0.7800
    check (commission_rate=0.7800),
  commission_amount_kes numeric(12,2) not null,
  status text not null default 'awaiting_fx'
    check (status in ('awaiting_fx','posted','paid','cancelled')),
  created_at timestamptz not null default now()
);

-- =========================================================
-- 7. PRODUCT CLICKS
-- =========================================================

create table if not exists public.sf_product_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.sf_products(id) on delete cascade,
  member_id uuid references public.sf_profiles(id) on delete set null,
  referral_code text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 8. ADMIN AUDIT LOGS
-- =========================================================

create table if not exists public.sf_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.sf_profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 9. ADMIN CHECK FUNCTION
-- =========================================================

create or replace function public.sf_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sf_profiles
    where id = auth.uid()
      and role in ('admin','super_admin')
  );
$$;

-- =========================================================
-- 10. AUTOMATIC MEMBER PROFILE CREATION
-- =========================================================

create or replace function public.sf_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ref_code text;
  referrer uuid;
begin
  ref_code := nullif(new.raw_user_meta_data->>'referral_code','');

  if ref_code is not null then
    select id into referrer
    from public.sf_profiles
    where referral_code = upper(ref_code);
  end if;

  insert into public.sf_profiles(
    id,
    full_name,
    country,
    referred_by
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'country',''),
    referrer
  )
  on conflict (id) do nothing;

  if referrer is not null and referrer <> new.id then
    insert into public.sf_referrals(
      referrer_id,
      referred_user_id
    )
    values (referrer,new.id)
    on conflict (referred_user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists sf_on_auth_user_created on auth.users;

create trigger sf_on_auth_user_created
after insert on auth.users
for each row
execute procedure public.sf_handle_new_user();

-- =========================================================
-- 11. VERIFIED PAYMENT PROCESSING
-- =========================================================

create or replace function public.sf_process_verified_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  referrer uuid;
  commission_kes numeric(12,2);
begin
  if new.status = 'verified'
     and old.status is distinct from 'verified' then

    select referred_by
    into referrer
    from public.sf_profiles
    where id = new.user_id;

    update public.sf_referrals
    set status = 'verified',
        verified_at = now()
    where referred_user_id = new.user_id
      and status <> 'verified';

    if referrer is not null then
      commission_kes := round(new.package_amount_kes * 0.78, 2);

      insert into public.sf_referral_commissions(
        referrer_id,
        referred_user_id,
        payment_id,
        commission_amount_kes
      )
      values (
        referrer,
        new.user_id,
        new.id,
        commission_kes
      )
      on conflict (payment_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists sf_payment_verified_trigger
on public.sf_payments;

create trigger sf_payment_verified_trigger
after update of status on public.sf_payments
for each row
execute procedure public.sf_process_verified_payment();

-- =========================================================
-- 12. ENABLE ROW LEVEL SECURITY
-- =========================================================

alter table public.sf_profiles enable row level security;
alter table public.sf_products enable row level security;
alter table public.sf_referrals enable row level security;
alter table public.sf_payments enable row level security;
alter table public.sf_wallet_ledger enable row level security;
alter table public.sf_referral_commissions enable row level security;
alter table public.sf_product_clicks enable row level security;
alter table public.sf_audit_logs enable row level security;

-- =========================================================
-- 13. PROFILE POLICIES
-- =========================================================

drop policy if exists "sf profiles read own or admin"
on public.sf_profiles;

create policy "sf profiles read own or admin"
on public.sf_profiles
for select to authenticated
using (
  id = auth.uid()
  or public.sf_is_admin()
);

drop policy if exists "sf profiles update own or admin"
on public.sf_profiles;

create policy "sf profiles update own or admin"
on public.sf_profiles
for update to authenticated
using (
  id = auth.uid()
  or public.sf_is_admin()
)
with check (
  id = auth.uid()
  or public.sf_is_admin()
);

revoke update on public.sf_profiles from authenticated;

grant update(full_name,country,updated_at)
on public.sf_profiles to authenticated;

-- =========================================================
-- 14. PRODUCT POLICIES
-- =========================================================

drop policy if exists "sf products public approved"
on public.sf_products;

create policy "sf products public approved"
on public.sf_products
for select to anon, authenticated
using (
  status = 'approved'
  or seller_id = auth.uid()
  or public.sf_is_admin()
);

drop policy if exists "sf products seller insert"
on public.sf_products;

create policy "sf products seller insert"
on public.sf_products
for insert to authenticated
with check (
  seller_id = auth.uid()
  and status = 'pending'
);

drop policy if exists "sf products admin update"
on public.sf_products;

create policy "sf products admin update"
on public.sf_products
for update to authenticated
using (public.sf_is_admin())
with check (public.sf_is_admin());

-- =========================================================
-- 15. REFERRAL POLICIES
-- =========================================================

drop policy if exists "sf referrals involved read"
on public.sf_referrals;

create policy "sf referrals involved read"
on public.sf_referrals
for select to authenticated
using (
  referrer_id = auth.uid()
  or referred_user_id = auth.uid()
  or public.sf_is_admin()
);

drop policy if exists "sf referrals admin update"
on public.sf_referrals;

create policy "sf referrals admin update"
on public.sf_referrals
for update to authenticated
using (public.sf_is_admin())
with check (public.sf_is_admin());

-- =========================================================
-- 16. PAYMENT POLICIES
-- =========================================================

drop policy if exists "sf payments own read"
on public.sf_payments;

create policy "sf payments own read"
on public.sf_payments
for select to authenticated
using (
  user_id = auth.uid()
  or public.sf_is_admin()
);

drop policy if exists "sf payments own create"
on public.sf_payments;

create policy "sf payments own create"
on public.sf_payments
for insert to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
);

drop policy if exists "sf payments admin update"
on public.sf_payments;

create policy "sf payments admin update"
on public.sf_payments
for update to authenticated
using (public.sf_is_admin())
with check (public.sf_is_admin());

-- =========================================================
-- 17. WALLET POLICIES
-- =========================================================

drop policy if exists "sf ledger own read"
on public.sf_wallet_ledger;

create policy "sf ledger own read"
on public.sf_wallet_ledger
for select to authenticated
using (
  user_id = auth.uid()
  or public.sf_is_admin()
);

drop policy if exists "sf ledger admin insert"
on public.sf_wallet_ledger;

create policy "sf ledger admin insert"
on public.sf_wallet_ledger
for insert to authenticated
with check (public.sf_is_admin());

-- =========================================================
-- 18. COMMISSION POLICIES
-- =========================================================

drop policy if exists "sf commissions involved read"
on public.sf_referral_commissions;

create policy "sf commissions involved read"
on public.sf_referral_commissions
for select to authenticated
using (
  referrer_id = auth.uid()
  or public.sf_is_admin()
);

drop policy if exists "sf commissions admin update"
on public.sf_referral_commissions;

create policy "sf commissions admin update"
on public.sf_referral_commissions
for update to authenticated
using (public.sf_is_admin())
with check (public.sf_is_admin());

-- =========================================================
-- 19. PRODUCT CLICK POLICIES
-- =========================================================

drop policy if exists "sf clicks public insert"
on public.sf_product_clicks;

create policy "sf clicks public insert"
on public.sf_product_clicks
for insert to anon, authenticated
with check (
  member_id is null
  or member_id = auth.uid()
);

drop policy if exists "sf clicks admin read"
on public.sf_product_clicks;

create policy "sf clicks admin read"
on public.sf_product_clicks
for select to authenticated
using (public.sf_is_admin());

-- =========================================================
-- 20. AUDIT LOG POLICIES
-- =========================================================

drop policy if exists "sf audit admin read"
on public.sf_audit_logs;

create policy "sf audit admin read"
on public.sf_audit_logs
for select to authenticated
using (public.sf_is_admin());

drop policy if exists "sf audit admin insert"
on public.sf_audit_logs;

create policy "sf audit admin insert"
on public.sf_audit_logs
for insert to authenticated
with check (public.sf_is_admin());

-- =========================================================
-- 21. SUPER ADMIN SETUP
-- =========================================================
-- After database review and successful account registration,
-- set the intended administrator's UUID manually:
--
-- update public.sf_profiles
-- set role = 'super_admin'
-- where id = 'YOUR-AUTH-USER-UUID';
--
-- Never expose service_role credentials.
-- =========================================================

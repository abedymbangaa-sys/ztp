-- ============================================
-- ZANZIBAR PARADISE TOURS - Self-Registration Schema
-- Endesha hii yote kwenye Supabase SQL Editor
-- ============================================

-- 1. CATEGORIES: hii ndiyo inakuruhusu kuongeza "Sports", "Gems" nk
--    bila kubadilisha code - unaongeza tu row hapa
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,          -- mfano: 'sports', 'gems'
  title text not null,               -- mfano: 'Michezo', 'Vito'
  emoji text default '📍',
  tag text default '',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Seed categories zilizopo tayari
insert into categories (key, title, emoji, tag) values
  ('hotels', 'Hoteli', '🏨', 'Stays'),
  ('beaches', 'Fukwe', '🏖️', 'Paradise Shores'),
  ('restaurants', 'Migahawa', '🍽️', 'Culinary Zanzibar'),
  ('attractions', 'Vivutio', '🗺️', 'Must-See Places'),
  ('heritage', 'Heritage', '🏛️', 'Heritage Sites'),
  ('experiences', 'Uzoefu', '✨', 'Unique Experiences'),
  ('caves', 'Mapango', '🕳️', 'Hidden Caves'),
  ('nature', 'Asili', '🌿', 'Nature & Wildlife')
on conflict (key) do nothing;

-- 2. PARTNERS: mmiliki wa biashara anayejisajili
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade unique,
  business_name text not null,
  contact_name text,
  phone text not null,
  email text,
  status text default 'pending',  -- pending | approved | rejected
  created_at timestamptz default now()
);

-- 3. LISTINGS: badala ya hotels table pekee, hii ni ya categories zote
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references partners(id) on delete set null,
  category_key text references categories(key),
  title text not null,
  location text,
  description text,
  image_url text,
  whatsapp_number text,
  maps_link text,
  status text default 'pending',  -- pending | approved | rejected
  created_at timestamptz default now()
);

-- 4. ROW LEVEL SECURITY
alter table categories enable row level security;
alter table partners enable row level security;
alter table listings enable row level security;

-- Everyone can read active categories
drop policy if exists "Public read categories" on categories;
create policy "Public read categories" on categories
  for select using (is_active = true);

-- Everyone can read approved listings
drop policy if exists "Public read approved listings" on listings;
create policy "Public read approved listings" on listings
  for select using (status = 'approved');

-- Partners can read/update their own profile
drop policy if exists "Partners manage own profile" on partners;
create policy "Partners manage own profile" on partners
  for all using (auth_user_id = auth.uid());

-- Anyone authenticated can create their partner profile (signup)
drop policy if exists "Anyone can create partner profile" on partners;
create policy "Anyone can create partner profile" on partners
  for insert with check (auth_user_id = auth.uid());

-- Partners can manage their own listings
drop policy if exists "Partners manage own listings" on listings;
create policy "Partners manage own listings" on listings
  for all using (
    partner_id in (select id from partners where auth_user_id = auth.uid())
  );

-- Partners can insert listings linked to themselves
drop policy if exists "Partners create own listings" on listings;
create policy "Partners create own listings" on listings
  for insert with check (
    partner_id in (select id from partners where auth_user_id = auth.uid())
  );

-- NOTE: Admin full-access policies zitaongezwa baada ya kuunda admin_users mapping.

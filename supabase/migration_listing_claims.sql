-- ============================================
-- ZANZIBAR PARADISE TOURS - Listing Claims / Removal Requests
-- Endesha hii kwenye Supabase SQL Editor
--
-- Lengo: kumpa mmiliki wa biashara ambaye listing yake iliwekwa na sisi
-- (kutoka taarifa za wazi/public) njia rasmi ya: (1) kudai umiliki wa
-- listing yake, (2) kuomba marekebisho, au (3) kuomba iondolewe kabisa
-- kwenye site - bila malipo na bila masharti magumu.
-- ============================================

-- 1. Weka wazi chanzo cha kila listing, ili tujue zipi ni za
--    "tumeziweka sisi kutoka taarifa za hadharani" dhidi ya zile
--    zilizosajiliwa moja kwa moja na mmiliki (partner signup).
alter table listings
  add column if not exists source text default 'curated', -- 'curated' | 'partner_submitted'
  add column if not exists is_claimed boolean default false;

-- 2. Jedwali la maombi ya "hii ni biashara yangu" / edit / removal
create table if not exists listing_claims (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  listing_title text,                 -- nakala ya jina wakati wa ombi (kwa rekodi hata listing ikifutwa)
  request_type text not null,         -- 'claim' | 'edit_request' | 'removal_request'
  business_name text not null,
  contact_name text,
  phone text not null,
  email text,
  message text,
  status text default 'pending',      -- pending | in_progress | resolved | rejected
  admin_notes text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

alter table listing_claims enable row level security;

-- Yeyote (hata bila akaunti) anaweza kutuma ombi la claim/edit/removal
drop policy if exists "Anyone can submit a listing claim" on listing_claims;
create policy "Anyone can submit a listing claim" on listing_claims
  for insert with check (true);

-- Admin pekee ndiye anaweza kusoma na kusasisha maombi haya
drop policy if exists "Admin can read listing claims" on listing_claims;
create policy "Admin can read listing claims" on listing_claims
  for select using (
    exists (select 1 from admin_users where auth_user_id = auth.uid())
  );

drop policy if exists "Admin can update listing claims" on listing_claims;
create policy "Admin can update listing claims" on listing_claims
  for update using (
    exists (select 1 from admin_users where auth_user_id = auth.uid())
  );

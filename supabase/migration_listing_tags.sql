-- ============================================
-- TAGS & FILTERS: Ongeza column ya tags kwenye listings
-- Endesha hii YOTE kwenye Supabase SQL Editor
-- ============================================

-- 1. Ongeza column 'tags' - orodha ya maneno (array), default tupu
alter table listings
  add column if not exists tags text[] default '{}';

-- 2. Index ya GIN - inafanya utafutaji/filter kwa tags kuwa haraka
--    (muhimu ukiwa na listings nyingi zijazo)
create index if not exists idx_listings_tags on listings using gin (tags);

-- ============================================
-- HIARI: mfano wa jinsi ya kuweka tags kwa listing zilizopo tayari
-- (Usiendeshe hii moja kwa moja - ni mfano tu wa syntax.
--  Tutaweka tags halisi kupitia Admin Dashboard baada ya
--  Hatua 3 kukamilika, si kwa SQL.)
-- ============================================
-- update listings set tags = array['beachfront', 'family-friendly']
--   where title = 'Kendwa Rocks Beach';

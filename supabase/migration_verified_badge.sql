-- ============================================
-- ONGEZA "VERIFIED BUSINESS" BADGE
-- Endesha hii YOTE kwenye Supabase SQL Editor
-- Salama: inaongeza column mpya tu, haiguzi data iliyopo
-- ============================================

alter table listings
  add column if not exists is_verified boolean default false;

-- Baada ya hii, nenda Admin Dashboard -> Listings, utaona kifungo
-- "Mark Verified" kando ya kila listing - bofya kuwasha/kuzima badge.

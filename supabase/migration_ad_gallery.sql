-- ============================================
-- ONGEZA GALLERY YA PICHA (HADI 10) KWENYE ADVERTISEMENTS
-- Endesha hii YOTE kwenye Supabase SQL Editor
-- Salama: inaongeza column mpya tu, haiguzi data iliyopo
-- ============================================

alter table advertisements
  add column if not exists gallery_images jsonb default '[]'::jsonb;

-- Baada ya hii, biashara zinazojisajili kwenye "Advertise Your Business"
-- zitaweza kupandisha hadi picha 10 (picha kuu + picha za ziada),
-- na Admin Dashboard ataweza kuedit/kufuta ads kikamilifu.

-- ============================================
-- FIX &amp; -> & KWENYE LISTINGS TABLE
-- Endesha HATUA 1 kwanza kuona zitakazoathirika,
-- kisha HATUA 2 kufanya marekebisho halisi.
-- ============================================

-- HATUA 1: ANGALIA KWANZA (SELECT tu, HAIBADILISHI CHOCHOTE)
-- Hii inakuonyesha rows zote zenye &amp; kabla ya kubadilisha
select id, title, location, maps_link
from listings
where title ilike '%&amp;%'
   or location ilike '%&amp;%'
   or description ilike '%&amp;%'
   or maps_link ilike '%&amp;%';

-- HATUA 2: FANYA MAREKEBISHO (endesha hii baada ya kuridhika na HATUA 1)
-- Inabadilisha &amp; kuwa & kwenye kolamu zote nne, salama kwa data nyingine yote
update listings
set
  title = replace(title, '&amp;', '&'),
  location = replace(location, '&amp;', '&'),
  description = replace(description, '&amp;', '&'),
  maps_link = replace(maps_link, '&amp;', '&')
where title ilike '%&amp;%'
   or location ilike '%&amp;%'
   or description ilike '%&amp;%'
   or maps_link ilike '%&amp;%';

-- HATUA 3: THIBITISHA IMEFANIKIWA (inatakiwa irudishe rows 0)
select count(*) as zilizobaki
from listings
where title ilike '%&amp;%'
   or location ilike '%&amp;%'
   or description ilike '%&amp;%'
   or maps_link ilike '%&amp;%';

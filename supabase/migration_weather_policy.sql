-- ============================================
-- WEATHER / CANCELLATION POLICY: Ongeza column kwenye listings
-- Endesha hii YOTE kwenye Supabase SQL Editor
-- Salama: inaongeza column mpya tu, haiguzi data iliyopo
-- ============================================

alter table listings
  add column if not exists weather_policy text;

-- ============================================
-- Baada ya hii, kila operator (hasa wa Tours/Attractions/Experiences)
-- ataweza kuandika sera yake ya mvua/kughairi kwenye Partner Dashboard
-- au Admin Dashboard, na itaonekana kwenye ukurasa wa listing kwa
-- watalii kabla hawajauliza swali hilo wenyewe.
-- ============================================

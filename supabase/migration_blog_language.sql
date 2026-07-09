-- ============================================================
-- Adds a "language" column to blog_posts so posts can be tagged
-- as English (for international tourists) or Swahili (for
-- Tanzanian travelers). Safe to run any time:
--   - Only ADDS a column, never removes or changes existing data.
--   - Existing posts automatically get language = 'en' (the
--     default), so nothing currently published changes or breaks.
-- ============================================================

alter table blog_posts
  add column if not exists language text not null default 'en';

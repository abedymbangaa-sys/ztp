-- ============================================================
-- Adds optional translation columns to the existing listings table.
-- Safe to run any time: only ADDS columns, never removes or
-- modifies existing data. Existing listings are unaffected and
-- will simply show English (the current default) until you fill
-- in a translation for a specific listing.
-- ============================================================

alter table listings
  add column if not exists description_it text,
  add column if not exists description_de text;

-- To translate a listing, just fill in the relevant column, e.g.:
-- update listings set description_it = '...' where id = '<listing-id>';
-- update listings set description_de = '...' where id = '<listing-id>';

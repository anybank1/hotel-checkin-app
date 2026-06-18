-- D1 schema for Cloudflare
-- Run: wrangler d1 execute hotel-checkin-db --remote --file=db/schema.sql
-- Or locally: wrangler d1 execute hotel-checkin-db --local --file=db/schema.sql

CREATE TABLE IF NOT EXISTS guests (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name       TEXT    NOT NULL,
  phone           TEXT    NOT NULL,
  id_card         TEXT    NOT NULL DEFAULT '',
  address         TEXT    NOT NULL DEFAULT '',
  room_number     TEXT    NOT NULL,
  room_type       TEXT    NOT NULL DEFAULT 'Standard',
  check_in        TEXT    NOT NULL,
  check_out       TEXT    NOT NULL,
  price_per_night REAL    NOT NULL DEFAULT 0,
  total_amount    REAL    NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

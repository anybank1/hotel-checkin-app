-- D1 schema for Cloudflare
-- Run: wrangler d1 execute hotel-checkin-db --remote --file=db/schema.sql

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
  recorded_by     TEXT    NOT NULL DEFAULT '',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  action          TEXT    NOT NULL,
  guest_id        INTEGER,
  guest_name      TEXT    NOT NULL DEFAULT '',
  details         TEXT    NOT NULL DEFAULT '',
  recorded_by     TEXT    NOT NULL DEFAULT '',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Migration: add recorded_by column if not exists (for existing D1 databases)
-- ALTER TABLE guests ADD COLUMN recorded_by TEXT NOT NULL DEFAULT '';

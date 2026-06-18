// Dev-only SQLite backend. This file is never bundled for Cloudflare/Edge builds.

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let _sqliteDb: Database.Database | null = null;

export function getSqliteDb(): Database.Database {
  if (_sqliteDb) return _sqliteDb;

  const dataDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, 'hotel.db'));
  db.pragma('journal_mode = WAL');

  db.exec(`
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
  `);

  _sqliteDb = db;
  return db;
}

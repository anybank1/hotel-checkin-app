import { GuestRecord, GuestInput, DashboardStats, RoomType, ActivityLog } from './types';

// ── Total rooms ──────────────────────────────────────────
export const TOTAL_ROOMS = 19;

// ── Helpers ───────────────────────────────────────────────

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  if (isNaN(a) || isNaN(b) || b <= a) return 0;
  return Math.round((b - a) / 86_400_000);
}

export function computeTotal(input: GuestInput): number {
  return nightsBetween(input.check_in, input.check_out) * input.price_per_night;
}

// ── D1 access (Cloudflare Workers) ────────────────────────

async function getD1(): Promise<D1Database | null> {
  try {
    const mod = await import('@opennextjs/cloudflare');
    // Try sync first, then async
    let ctx;
    try {
      ctx = mod.getCloudflareContext();
    } catch {
      ctx = await mod.getCloudflareContext({ async: true });
    }
    const db = ctx?.env?.DB;
    if (db && typeof db.prepare === 'function') {
      return db;
    }
    return null;
  } catch (e) {
    console.error('getD1 error:', e);
    return null;
  }
}

function isCloudflare(): boolean {
  try {
    return typeof caches !== 'undefined' && typeof (caches as any).default !== 'undefined';
  } catch {
    return false;
  }
}

// ── SQLite (dev) implementation ───────────────────────────

let _sqliteDb: any = null;

async function getSqlite() {
  if (_sqliteDb) return _sqliteDb;
  const Database = (await import('better-sqlite3')).default;
  const { join } = await import('path');
  const { mkdirSync } = await import('fs');

  const dataDir = join(process.cwd(), 'data');
  mkdirSync(dataDir, { recursive: true });
  const db = new Database(join(dataDir, 'hotel.db'));
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS guests (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name       TEXT    NOT NULL,
      phone           TEXT    NOT NULL,
      id_card         TEXT    NOT NULL DEFAULT '',
      address         TEXT    NOT NULL DEFAULT '',
      room_number     TEXT    NOT NULL,
      room_type       TEXT    NOT NULL DEFAULT 'Standard Double Bed',
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
  `);

  // Migration: add recorded_by if missing
  try {
    db.exec(`ALTER TABLE guests ADD COLUMN recorded_by TEXT NOT NULL DEFAULT ''`);
  } catch { /* column already exists */ }

  _sqliteDb = db;
  return db;
}

// ── Activity Logging ──────────────────────────────────────

async function logActivity(entry: Omit<ActivityLog, 'id' | 'created_at'>): Promise<void> {
  const d1 = await getD1();
  if (d1) {
    try {
      await d1.prepare(
        `INSERT INTO activity_logs (action, guest_id, guest_name, details, recorded_by) VALUES (?, ?, ?, ?, ?)`
      ).bind(entry.action, entry.guest_id, entry.guest_name, entry.details, entry.recorded_by).run();
    } catch (e) {
      console.error('D1 logActivity error:', e);
    }
    return;
  }
  if (isCloudflare()) return;
  const db = await getSqlite();
  db.prepare(
    `INSERT INTO activity_logs (action, guest_id, guest_name, details, recorded_by) VALUES (?, ?, ?, ?, ?)`
  ).run(entry.action, entry.guest_id, entry.guest_name, entry.details, entry.recorded_by);
}

export async function getActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
  const d1 = await getD1();
  if (d1) {
    try {
      const result = await d1.prepare(
        `SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?`
      ).bind(limit).all<ActivityLog>();
      return Array.isArray(result?.results) ? result.results : [];
    } catch (e) {
      console.error('D1 getActivityLogs error:', e);
      return [];
    }
  }
  if (isCloudflare()) return [];
  const db = await getSqlite();
  return db.prepare(`SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?`).all(limit) as ActivityLog[];
}

// ── Public API ────────────────────────────────────────────

export async function getAllGuests(search?: string): Promise<GuestRecord[]> {
  const d1 = await getD1();

  if (d1) {
    try {
      let result;
      if (search) {
        result = await d1.prepare(
          `SELECT * FROM guests WHERE full_name LIKE ? OR phone LIKE ? OR room_number LIKE ? ORDER BY id DESC`
        ).bind(`%${search}%`, `%${search}%`, `%${search}%`).all<GuestRecord>();
      } else {
        result = await d1.prepare(`SELECT * FROM guests ORDER BY id DESC`).all<GuestRecord>();
      }
      return Array.isArray(result?.results) ? result.results : [];
    } catch (e) {
      console.error('D1 getAllGuests error:', e);
      return [];
    }
  }

  if (isCloudflare()) return [];
  const db = await getSqlite();
  if (search) {
    return db.prepare(
      `SELECT * FROM guests WHERE full_name LIKE ? OR phone LIKE ? OR room_number LIKE ? ORDER BY id DESC`
    ).all(`%${search}%`, `%${search}%`, `%${search}%`) as GuestRecord[];
  }
  return db.prepare(`SELECT * FROM guests ORDER BY id DESC`).all() as GuestRecord[];
}

export async function createGuest(input: GuestInput): Promise<GuestRecord> {
  const total = computeTotal(input);
  const d1 = await getD1();

  if (d1) {
    const stmt = d1.prepare(`
      INSERT INTO guests (full_name, phone, id_card, address, room_number, room_type,
        check_in, check_out, price_per_night, total_amount, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = await stmt.bind(
      input.full_name, input.phone, input.id_card, input.address,
      input.room_number, input.room_type, input.check_in, input.check_out,
      input.price_per_night, total, input.recorded_by || ''
    ).run();
    const id = Number(result.meta.last_row_id);
    await logActivity({
      action: 'create',
      guest_id: id,
      guest_name: input.full_name,
      details: `เพิ่มการเข้าพัก ห้อง ${input.room_number} (${input.room_type}) ${input.check_in} → ${input.check_out} รวม ${total} ฿`,
      recorded_by: input.recorded_by || '',
    });
    return { id, ...input, total_amount: total, created_at: new Date().toISOString() } as GuestRecord;
  }

  const db = await getSqlite();
  const result = db.prepare(`
    INSERT INTO guests (full_name, phone, id_card, address, room_number, room_type,
      check_in, check_out, price_per_night, total_amount, recorded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.full_name, input.phone, input.id_card, input.address,
    input.room_number, input.room_type, input.check_in, input.check_out,
    input.price_per_night, total, input.recorded_by || ''
  );
  const id = Number(result.lastInsertRowid);
  await logActivity({
    action: 'create',
    guest_id: id,
    guest_name: input.full_name,
    details: `เพิ่มการเข้าพัก ห้อง ${input.room_number} (${input.room_type}) ${input.check_in} → ${input.check_out} รวม ${total} ฿`,
    recorded_by: input.recorded_by || '',
  });
  return { id, ...input, total_amount: total, created_at: new Date().toISOString() } as GuestRecord;
}

export async function updateGuest(id: number, input: GuestInput): Promise<GuestRecord | null> {
  const total = computeTotal(input);
  const d1 = await getD1();

  if (d1) {
    const stmt = d1.prepare(`
      UPDATE guests SET
        full_name = ?, phone = ?, id_card = ?, address = ?,
        room_number = ?, room_type = ?,
        check_in = ?, check_out = ?, price_per_night = ?, total_amount = ?, recorded_by = ?
      WHERE id = ?
    `);
    const result = await stmt.bind(
      input.full_name, input.phone, input.id_card, input.address,
      input.room_number, input.room_type, input.check_in, input.check_out,
      input.price_per_night, total, input.recorded_by || '', id
    ).run();
    if ((result.meta.changes ?? 0) === 0) return null;
    await logActivity({
      action: 'update',
      guest_id: id,
      guest_name: input.full_name,
      details: `แก้ไขการเข้าพัก ห้อง ${input.room_number} (${input.room_type}) ${input.check_in} → ${input.check_out} รวม ${total} ฿`,
      recorded_by: input.recorded_by || '',
    });
    return { id, ...input, total_amount: total } as GuestRecord;
  }

  const db = await getSqlite();
  const result = db.prepare(`
    UPDATE guests SET
      full_name = ?, phone = ?, id_card = ?, address = ?,
      room_number = ?, room_type = ?,
      check_in = ?, check_out = ?, price_per_night = ?, total_amount = ?, recorded_by = ?
    WHERE id = ?
  `).run(
    input.full_name, input.phone, input.id_card, input.address,
    input.room_number, input.room_type, input.check_in, input.check_out,
    input.price_per_night, total, input.recorded_by || '', id
  );
  if (result.changes === 0) return null;
  await logActivity({
    action: 'update',
    guest_id: id,
    guest_name: input.full_name,
    details: `แก้ไขการเข้าพัก ห้อง ${input.room_number} (${input.room_type}) ${input.check_in} → ${input.check_out} รวม ${total} ฿`,
    recorded_by: input.recorded_by || '',
  });
  return { id, ...input, total_amount: total } as GuestRecord;
}

export async function deleteGuest(id: number): Promise<boolean> {
  const d1 = await getD1();

  // Get guest name before deleting for the log
  let guestName = '';
  if (d1) {
    const g = await d1.prepare(`SELECT full_name FROM guests WHERE id = ?`).bind(id).first<{ full_name: string }>();
    guestName = g?.full_name || '';
    const result = await d1.prepare(`DELETE FROM guests WHERE id = ?`).bind(id).run();
    if ((result.meta.changes ?? 0) === 0) return false;
    await logActivity({
      action: 'delete',
      guest_id: id,
      guest_name: guestName,
      details: `ลบรายการเข้าพัก #${id} (${guestName})`,
      recorded_by: 'admin',
    });
    return true;
  }

  const db = await getSqlite();
  const g = db.prepare(`SELECT full_name FROM guests WHERE id = ?`).get(id) as { full_name: string } | undefined;
  guestName = g?.full_name || '';
  const result = db.prepare(`DELETE FROM guests WHERE id = ?`).run(id);
  if (result.changes === 0) return false;
  await logActivity({
    action: 'delete',
    guest_id: id,
    guest_name: guestName,
    details: `ลบรายการเข้าพัก #${id} (${guestName})`,
    recorded_by: 'admin',
  });
  return true;
}

export async function getStats(): Promise<DashboardStats> {
  const guests = await getAllGuests();
  const safeGuests = Array.isArray(guests) ? guests : [];
  const today = new Date().toISOString().slice(0, 10);

  const currentGuests = safeGuests.filter(r => r.check_in <= today && r.check_out >= today);
  const occupiedRooms = new Set(currentGuests.map(r => r.room_number)).size;
  const totalRevenue = safeGuests.reduce((sum, r) => sum + r.total_amount, 0);

  // Monthly revenue breakdown
  const monthMap = new Map<string, { revenue: number; count: number }>();
  for (const g of safeGuests) {
    const month = g.check_in.slice(0, 7); // YYYY-MM
    const existing = monthMap.get(month) || { revenue: 0, count: 0 };
    existing.revenue += g.total_amount;
    existing.count++;
    monthMap.set(month, existing);
  }
  const monthly_revenue = Array.from(monthMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, v]) => ({ month, revenue: v.revenue, count: v.count }));

  const breakdownMap = new Map<RoomType, { count: number; revenue: number }>();
  for (const g of safeGuests) {
    const existing = breakdownMap.get(g.room_type) || { count: 0, revenue: 0 };
    existing.count++;
    existing.revenue += g.total_amount;
    breakdownMap.set(g.room_type, existing);
  }

  return {
    total_guests: safeGuests.length,
    current_guests: currentGuests.length,
    total_revenue: totalRevenue,
    available_rooms: TOTAL_ROOMS - occupiedRooms,
    occupied_rooms: occupiedRooms,
    room_breakdown: Array.from(breakdownMap.entries()).map(([room_type, v]) => ({
      room_type,
      count: v.count,
      revenue: v.revenue,
    })),
    monthly_revenue,
  };
}

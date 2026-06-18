import { GuestRecord, GuestInput, DashboardStats, RoomType } from './types';

// ── Total rooms (ปรับได้ที่นี่) ─────────────────────────
export const TOTAL_ROOMS = 19;

// ── Helpers ──────────────────────────────────────────

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  if (isNaN(a) || isNaN(b) || b <= a) return 0;
  return Math.round((b - a) / 86_400_000);
}

export function computeTotal(input: GuestInput): number {
  return nightsBetween(input.check_in, input.check_out) * input.price_per_night;
}

// ── Environment detection ───────────────────────────────

function isCloudflare(): boolean {
  try {
    return typeof caches !== 'undefined' && typeof (caches as any).default !== 'undefined';
  } catch {
    return false;
  }
}

function isNodeLike(): boolean {
  try {
    return typeof process !== 'undefined' && !!process.versions?.node;
  } catch {
    return false;
  }
}

// ── D1 access (Cloudflare Workers) ────────────────────────
// getCloudflareContext() in @opennextjs/cloudflare v1.x returns a Promise when async: true

async function getD1(): Promise<D1Database | null> {
  if (!isCloudflare()) return null;
  try {
    const mod = await import('@opennextjs/cloudflare');
    const ctx = await mod.getCloudflareContext({ async: true });
    const db = ctx.env.DB;
    if (db && typeof db.prepare === 'function') {
      return db;
    }
    return null;
  } catch {
    return null;
  }
}

// ── SQLite (dev) backend ──────────────────────────────────
// Loaded dynamically only in Node.js dev environment. The separate module
// ensures better-sqlite3 is never pulled into the Edge bundle.

async function getSqlite() {
  // Dynamic import of a dev-only module. Webpack for the Edge runtime will
  // not follow this branch because isNodeLike() is false there.
  const mod = await import('./sqlite-dev');
  return mod.getSqliteDb();
}

// ── Public API (async, auto-detects backend) ─────────────

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
      const guests = result?.results;
      return Array.isArray(guests) ? guests : [];
    } catch (e) {
      console.error('D1 getAllGuests error:', e);
      return [];
    }
  }

  if (isCloudflare()) {
    console.error('D1 not available in Cloudflare environment');
    return [];
  }

  if (!isNodeLike()) {
    console.error('No supported database backend available');
    return [];
  }

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
        check_in, check_out, price_per_night, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = await stmt.bind(
      input.full_name, input.phone, input.id_card, input.address,
      input.room_number, input.room_type, input.check_in, input.check_out,
      input.price_per_night, total
    ).run();
    return { id: Number(result.meta.last_row_id), ...input, total_amount: total } as GuestRecord;
  }

  const db = await getSqlite();
  const result = db.prepare(`
    INSERT INTO guests (full_name, phone, id_card, address, room_number, room_type,
      check_in, check_out, price_per_night, total_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.full_name, input.phone, input.id_card, input.address,
    input.room_number, input.room_type, input.check_in, input.check_out,
    input.price_per_night, total
  );
  return { id: Number(result.lastInsertRowid), ...input, total_amount: total } as GuestRecord;
}

export async function updateGuest(id: number, input: GuestInput): Promise<GuestRecord | null> {
  const total = computeTotal(input);
  const d1 = await getD1();

  if (d1) {
    const stmt = d1.prepare(`
      UPDATE guests SET
        full_name = ?, phone = ?, id_card = ?, address = ?,
        room_number = ?, room_type = ?,
        check_in = ?, check_out = ?, price_per_night = ?, total_amount = ?
      WHERE id = ?
    `);
    const result = await stmt.bind(
      input.full_name, input.phone, input.id_card, input.address,
      input.room_number, input.room_type, input.check_in, input.check_out,
      input.price_per_night, total, id
    ).run();
    if ((result.meta.changes ?? 0) === 0) return null;
    return { id, ...input, total_amount: total } as GuestRecord;
  }

  const db = await getSqlite();
  const result = db.prepare(`
    UPDATE guests SET
      full_name = ?, phone = ?, id_card = ?, address = ?,
      room_number = ?, room_type = ?,
      check_in = ?, check_out = ?, price_per_night = ?, total_amount = ?
    WHERE id = ?
  `).run(
    input.full_name, input.phone, input.id_card, input.address,
    input.room_number, input.room_type, input.check_in, input.check_out,
    input.price_per_night, total, id
  );
  if (result.changes === 0) return null;
  return { id, ...input, total_amount: total } as GuestRecord;
}

export async function deleteGuest(id: number): Promise<boolean> {
  const d1 = await getD1();

  if (d1) {
    const result = await d1.prepare(`DELETE FROM guests WHERE id = ?`).bind(id).run();
    return (result.meta.changes ?? 0) > 0;
  }

  const db = await getSqlite();
  const result = db.prepare(`DELETE FROM guests WHERE id = ?`).run(id);
  return result.changes > 0;
}

export async function getStats(): Promise<DashboardStats> {
  const guests = await getAllGuests();
  const safeGuests = Array.isArray(guests) ? guests : [];
  const today = new Date().toISOString().slice(0, 10);

  const currentGuests = safeGuests.filter(r => r.check_in <= today && r.check_out >= today);
  const occupiedRooms = new Set(currentGuests.map(r => r.room_number)).size;
  const totalRevenue = safeGuests.reduce((sum, r) => sum + r.total_amount, 0);

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
  };
}

// ── D1 types (see env.d.ts) ─────────────────────────────────────

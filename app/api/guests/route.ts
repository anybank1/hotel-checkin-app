import { NextRequest, NextResponse } from 'next/server';
import { getAllGuests, createGuest, getStats } from '@/lib/db';
import { GuestInput, ADMIN_PASSWORD, DEFAULT_ROOM_TYPE } from '@/lib/types';

export const runtime = 'nodejs';

// ── GET: list + search + stats ───────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const status = (searchParams.get('status') || '').trim();

    let guests = await getAllGuests(q || undefined);
    if (!Array.isArray(guests)) guests = [];

    if (status) {
      const today = new Date().toISOString().slice(0, 10);
      if (status === 'current') {
        guests = guests.filter(r => r.check_in <= today && r.check_out >= today);
      } else if (status === 'past') {
        guests = guests.filter(r => r.check_out < today);
      } else if (status === 'upcoming') {
        guests = guests.filter(r => r.check_in > today);
      }
    }

    const stats = await getStats();
    return NextResponse.json({ guests, stats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── POST: create ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<GuestInput>;

    if (!body.full_name || !body.phone || !body.room_number ||
        !body.check_in || !body.check_out || !body.price_per_night) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const input: GuestInput = {
      full_name: body.full_name.trim(),
      phone: body.phone.trim(),
      id_card: (body.id_card || '').trim(),
      address: (body.address || '').trim(),
      room_number: body.room_number.trim(),
      room_type: body.room_type || DEFAULT_ROOM_TYPE,
      check_in: body.check_in,
      check_out: body.check_out,
      price_per_night: Number(body.price_per_night),
      recorded_by: (body.recorded_by || '').trim(),
    };

    const record = await createGuest(input);
    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

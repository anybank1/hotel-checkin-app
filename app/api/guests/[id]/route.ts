import { NextRequest, NextResponse } from 'next/server';
import { updateGuest, deleteGuest } from '@/lib/db';
import { GuestInput, ADMIN_PASSWORD, DEFAULT_ROOM_TYPE } from '@/lib/types';

export const runtime = 'nodejs';

// ── PUT: update ──────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
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

    const record = await updateGuest(id, input);
    if (!record) {
      return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── DELETE (requires password) ───────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    const body = await req.json().catch(() => ({})) as { password?: string };

    if (body.password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'รหัสผ่านไม่ถูกต้อง' },
        { status: 403 }
      );
    }

    const success = await deleteGuest(id);
    if (!success) {
      return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

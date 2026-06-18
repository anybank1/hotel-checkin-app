import { NextRequest } from 'next/server';
import { getAllGuests } from '@/lib/db';

// OpenNext for Cloudflare bundles nodejs runtime routes into the Worker via
// the cloudflare-node wrapper. Edge runtime routes must be in a separate
// function, which is more complex for a simple CRUD app.
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const status = (searchParams.get('status') || '').trim();

    let guests = await getAllGuests(q || undefined);

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

    // Build CSV
    const headers = [
      'ลำดับ', 'ชื่อ-นามสกุล', 'เบอร์โทร', 'บัตรประชาชน/พาสปอร์ต',
      'ที่อยู่', 'หมายเลขห้อง', 'ประเภทห้อง', 'วันเช็คอิน', 'วันเช็คเอาท์',
      'ราคา/คืน', 'ยอดรวม', 'สถานะ'
    ];

    const today = new Date().toISOString().slice(0, 10);
    const rows = guests.map((g, i) => {
      const st = g.check_in > today ? 'จะเข้าพัก' : g.check_out < today ? 'เช็คเอาท์แล้ว' : 'กำลังพัก';
      return [
        i + 1,
        g.full_name,
        g.phone,
        g.id_card,
        g.address,
        g.room_number,
        g.room_type,
        g.check_in,
        g.check_out,
        g.price_per_night,
        g.total_amount,
        st,
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
    });

    // Add BOM for Excel Thai compatibility
    const csv = '\uFEFF' + headers.map(h => `"${h}"`).join(',') + '\n' + rows.join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="guests-${today}.csv"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(msg, { status: 500 });
  }
}

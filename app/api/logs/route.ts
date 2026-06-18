import { NextRequest, NextResponse } from 'next/server';
import { getActivityLogs } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || '100');
    const logs = await getActivityLogs(limit);
    return NextResponse.json({ logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

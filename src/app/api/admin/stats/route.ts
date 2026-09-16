import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDashboardStats, type RangeKey } from '@/lib/stats';

/** Polled by the dashboard every 30 seconds for the live figures. */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const range = (new URL(request.url).searchParams.get('range') ?? '7d') as RangeKey;
  const valid: RangeKey[] = ['24h', '7d', '30d'];
  const stats = await getDashboardStats(valid.includes(range) ? range : '7d');

  return NextResponse.json(stats, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

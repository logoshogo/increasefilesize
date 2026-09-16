import { getDashboardStats } from '@/lib/stats';
import { StatsDashboard } from '@/components/admin/StatsDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Rendered server-side for the first paint, then refreshed client-side
  // every 30 seconds from /api/admin/stats.
  const initial = await getDashboardStats('7d');
  return <StatsDashboard initial={initial} />;
}

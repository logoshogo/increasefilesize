import { getSettings } from '@/lib/settings';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return <SettingsForm initial={settings} />;
}

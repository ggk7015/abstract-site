import { getFeatures, getLinks, getServerInfo, getSiteMeta } from '@/lib/settings';
import { SettingsEditor } from '@/components/admin/SettingsEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: '網站設定' };

export default async function AdminSettingsPage() {
  const [server, features, siteMeta, links] = await Promise.all([
    getServerInfo(),
    getFeatures(),
    getSiteMeta(),
    getLinks(),
  ]);
  return <SettingsEditor server={server} features={features} siteMeta={siteMeta} links={links} />;
}

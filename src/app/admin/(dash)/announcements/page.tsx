import { listAll } from '@/lib/announcements';
import { AnnouncementManager } from '@/components/admin/AnnouncementManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: '公告管理' };

export default async function AdminAnnouncementsPage() {
  const items = await listAll();
  return <AnnouncementManager initial={items} />;
}

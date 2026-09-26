import { AccountSecurity } from '@/components/admin/AccountSecurity';

export const dynamic = 'force-dynamic';
export const metadata = { title: '帳號安全' };

export default function AdminAccountPage() {
  return <AccountSecurity />;
}

import type { ReactNode } from 'react';
import AdminLayoutClient from './AdminLayoutClient';

// Force dynamic rendering for all admin pages — they require auth context
// and should never be statically prerendered at build time
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }): ReactNode {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}

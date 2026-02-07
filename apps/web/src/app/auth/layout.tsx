import type { ReactNode } from 'react';
import AuthLayoutClient from './AuthLayoutClient';

// Force dynamic rendering — auth pages use useAuth, useRouter, useSearchParams
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: ReactNode }): ReactNode {
  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}

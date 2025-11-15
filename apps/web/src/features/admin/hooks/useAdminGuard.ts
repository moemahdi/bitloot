import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type User } from '../../../hooks/useAuth';

/**
 * useAdminGuard: Hook that verifies user is admin, redirects if not
 *
 * Usage:
 * ```
 * const router = useRouter();
 * useAdminGuard();
 * ```
 *
 * Features:
 * - Checks authentication via useAuth()
 * - Verifies user.role === 'admin'
 * - Redirects to / if not admin
 * - Redirects to /auth/login if not authenticated
 */
export function useAdminGuard(): {
  isLoading: boolean;
  isAdmin: boolean;
  user: User | null;
} {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated
    if (user === null) {
      router.push('/auth/login');
      return;
    }

    // Not admin
    if (user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user, isLoading, router]);

  return {
    isLoading,
    isAdmin: user?.role === 'admin',
    user,
  };
}

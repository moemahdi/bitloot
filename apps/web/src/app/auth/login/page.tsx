'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { OTPLogin } from '@/features/auth/OTPLogin';
import { Skeleton } from '@/design-system/primitives/skeleton';

/**
 * Login Page: OTP-based passwordless authentication
 * Redirects to dashboard if user already authenticated
 */
export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/profile'); // Redirect to profile/dashboard
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your digital keys
          </p>
        </div>
        <OTPLogin />
      </div>
    </div>
  );
}

'use client';

import { OTPLogin } from '@/features/auth/OTPLogin';

/**
 * Login Page: OTP-based passwordless authentication
 * Auth state management and redirects are handled by AuthLayout
 */
export default function LoginPage(): React.ReactElement {
  return <OTPLogin />;
}


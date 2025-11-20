'use client';

import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { authClient } from '@bitloot/sdk';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/design-system/primitives/input-otp';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Card, CardHeader, CardContent } from '@/design-system/primitives/card';
import { Alert, AlertDescription } from '@/design-system/primitives/alert';
import { useAuth } from '@/hooks/useAuth';

// Schema for email step
const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Schema for OTP step
const otpSchema = z.object({
  code: z.string().length(6, 'Must be exactly 6 digits'),
});

type EmailForm = z.infer<typeof emailSchema>;
type OTPForm = z.infer<typeof otpSchema>;

/**
 * OTPLogin Component: Two-step passwordless authentication
 * Step 1: Enter email → Request OTP code (with CAPTCHA verification)
 * Step 2: Enter 6-digit code → Verify OTP → Get JWT tokens
 */
export function OTPLogin(): React.ReactElement {
  const { login } = useAuth();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [_captchaToken, _setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);

  // Email form
  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  // OTP form
  const otpForm = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  });

  // Step 1: Request OTP
  const onEmailSubmit = async (data: EmailForm): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // Check if CAPTCHA token is available (if CAPTCHA is enabled on backend)
      if (_captchaToken === undefined || _captchaToken === null) {
        // If CAPTCHA is required but token not provided, show error
        // (backend will handle enforcement if TURNSTILE_ENABLED=true)
      }

      // Use SDK auth client to request OTP with CAPTCHA token
      const result = await authClient.requestOtp(data.email, _captchaToken ?? undefined);

      if (!result.success) {
        throw new Error(result.error ?? 'Failed to send OTP');
      }

      setEmail(data.email);
      setStep('otp');
      _setCaptchaToken(null); // Reset CAPTCHA for next request
      if (turnstileRef.current !== null && turnstileRef.current !== undefined) {
        turnstileRef.current.remove();
      }
      setCountdown(result.expiresIn ?? 300); // Default to 5 minutes

      // Countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      _setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const onOTPSubmit = async (data: OTPForm): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // Use SDK auth client to verify OTP
      const result = await authClient.verifyOtp(email, data.code);

      if (!result.success) {
        throw new Error(result.error ?? 'Invalid OTP code');
      }

      if (result.accessToken === null || result.accessToken === undefined) {
        throw new Error('No access token received');
      }

      if (result.refreshToken === null || result.refreshToken === undefined) {
        throw new Error('No refresh token received');
      }

      if (result.user === null || result.user === undefined) {
        throw new Error('No user data received');
      }

      // Map SDK user to useAuth User interface
      const user = {
        id: result.user.id,
        email: result.user.email,
        emailConfirmed: result.user.emailVerified,
        createdAt: new Date().toISOString(), // Fallback if missing
        role: (result.user.role === 'admin' ? 'admin' : 'user'), // Use actual role from backend, fallback to 'user'
      };

      // Use useAuth hook to login (sets cookies and state)
      login(result.accessToken, result.refreshToken, user);

      // Redirect is handled by the page component or useAuth state change
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'email') {
    return (
      <Card className="w-full">
        <CardHeader>
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a verification code
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                {...emailForm.register('email')}
                id="email"
                type="email"
                placeholder="you@example.com"
                disabled={loading}
                aria-label="Email address"
                aria-invalid={Boolean(emailForm.formState.errors.email)}
              />
              {emailForm.formState.errors.email !== null &&
                emailForm.formState.errors.email !== undefined && (
                  <span className="text-sm text-destructive">
                    {emailForm.formState.errors.email.message}
                  </span>
                )}
            </div>

            {error !== null && error !== undefined && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Cloudflare Turnstile CAPTCHA Widget */}
            <div className="flex justify-center">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''}
                onSuccess={(token) => {
                  _setCaptchaToken(token);
                }}
                onError={() => {
                  _setCaptchaToken(null);
                  setError('CAPTCHA verification failed. Please try again.');
                }}
                onExpire={() => {
                  _setCaptchaToken(null);
                }}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <h1 className="text-2xl font-bold">Enter Verification Code</h1>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium">{email}</span>
        </p>
        {countdown > 0 && (
          <p className="text-xs text-muted-foreground">
            Code expires in: <span className="font-mono">{formatCountdown(countdown)}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
          <div className="space-y-2 flex flex-col items-center">
            <label htmlFor="code" className="text-sm font-medium self-start">
              Verification Code
            </label>
            <Controller
              control={otpForm.control}
              name="code"
              render={({ field }) => (
                <InputOTP
                  maxLength={6}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={loading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              )}
            />
            {otpForm.formState.errors.code !== null &&
              otpForm.formState.errors.code !== undefined && (
                <span className="text-sm text-destructive">
                  {otpForm.formState.errors.code.message}
                </span>
              )}
          </div>

          {error !== null && error !== undefined && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                setStep('email');
                setError(null);
                otpForm.reset();
              }}
            >
              Back
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            className="w-full text-sm"
            onClick={() => {
              setStep('email');
              setError(null);
              otpForm.reset();
              emailForm.reset();
            }}
          >
            Use Different Email
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

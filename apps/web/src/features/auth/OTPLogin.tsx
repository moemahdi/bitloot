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
import { Alert, AlertDescription } from '@/design-system/primitives/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { useAuth, type User } from '@/hooks/useAuth';
import { Mail, ArrowLeft, RefreshCw, Loader2, Shield, CheckCircle2, AlertTriangle, Key, Lock, Zap } from 'lucide-react';

// Step indicator component for visual progress
function StepIndicator({ currentStep }: { currentStep: 'email' | 'otp' }): React.ReactElement {
  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
          currentStep === 'email' 
            ? 'bg-cyan-glow text-bg-primary shadow-glow-cyan' 
            : 'bg-green-success/20 text-green-success border border-green-success/30'
        }`}>
          {currentStep === 'otp' ? <CheckCircle2 className="w-4 h-4" /> : '1'}
        </div>
        <span className={`text-xs font-medium hidden sm:inline ${
          currentStep === 'email' ? 'text-cyan-glow' : 'text-green-success'
        }`}>Email</span>
      </div>
      
      {/* Connector */}
      <div className={`w-12 h-0.5 transition-all duration-500 ${
        currentStep === 'otp' 
          ? 'bg-linear-to-r from-green-success to-cyan-glow' 
          : 'bg-border-subtle'
      }`} />
      
      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
          currentStep === 'otp' 
            ? 'bg-cyan-glow text-bg-primary shadow-glow-cyan' 
            : 'bg-bg-secondary/50 text-text-muted border border-border-subtle'
        }`}>
          2
        </div>
        <span className={`text-xs font-medium hidden sm:inline ${
          currentStep === 'otp' ? 'text-cyan-glow' : 'text-text-muted'
        }`}>Verify</span>
      </div>
    </div>
  );
}

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
 * 
 * Now includes full page wrapper with logo, card, security features, and footer.
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
      const result = await authClient.requestOtp(data.email, _captchaToken ?? undefined);

      if (!result.success) {
        throw new Error(result.error ?? 'Failed to send OTP');
      }

      setEmail(data.email);
      setStep('otp');
      _setCaptchaToken(null);
      if (turnstileRef.current !== null && turnstileRef.current !== undefined) {
        turnstileRef.current.remove();
      }
      setCountdown(result.expiresIn ?? 300);

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

      const user: User = {
        id: result.user.id,
        email: result.user.email,
        emailConfirmed: result.user.emailVerified,
        createdAt: new Date().toISOString(),
        role: (result.user.role === 'admin' ? 'admin' : 'user'),
      };

      // Pass sessionId to track current session
      login(result.accessToken, result.refreshToken, user, result.sessionId ?? undefined);
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

  const handleResendCode = (): void => {
    setStep('email');
    setError(null);
    otpForm.reset();
    emailForm.setValue('email', email);
  };

  // ============================================================================
  // UNIFIED RENDER WITH WRAPPER
  // ============================================================================
  
  return (
    <Card className="w-full max-w-md mx-auto glass border border-cyan-glow/20 shadow-glow-cyan hover:shadow-glow-purple transition-all duration-500 animate-fade-in">
      {/* Card Header with Logo & Title */}
      <CardHeader className="space-y-4 pb-4">
        {/* Logo / Brand Section */}
        <div className="flex items-center gap-3 pb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
            <Key className="w-5 h-5 text-cyan-glow" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">
              BitLoot
            </h1>
            <p className="text-xs text-text-muted">
              Crypto commerce
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className=" w-full h-px bg-border-subtle border-t " />

        {/* Security Badge */}
        <div className="flex justify-center pt-2 pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-success/10 border border-green-success/30 text-xs text-green-success">
            <Shield className="w-3.5 h-3.5" />
            Secure Login
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1 items-center text-center ">
          <CardTitle className="text-xl text-text-primary">
            {step === 'email' ? 'Request Verification Code' : 'Enter Verification Code'}
          </CardTitle>
          <CardDescription className="text-text-muted text-sm">
            {step === 'email'
              ? 'Sign in with a secure one-time password'
              : (
                <>
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-cyan-glow break-all">{email}</span>
                </>
              )
            }
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* Step Progress Indicator */}
        <StepIndicator currentStep={step} />

        {/* Conditional Form Content */}
        {step === 'email' ? (
          /* ==================== EMAIL STEP ==================== */
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
                Email Address
                <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <Input
                  {...emailForm.register('email')}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  disabled={loading}
                  aria-label="Email address"
                  aria-invalid={Boolean(emailForm.formState.errors.email)}
                  className="pl-11 h-12 bg-bg-secondary/50 border-border-subtle focus:border-cyan-glow focus:ring-cyan-glow/20 text-text-primary placeholder:text-text-muted transition-all duration-200"
                />
              </div>
              {emailForm.formState.errors.email !== null &&
                emailForm.formState.errors.email !== undefined && (
                  <span className="text-sm text-red-400">
                    {emailForm.formState.errors.email.message}
                  </span>
                )}
            </div>

            {/* Error Alert */}
            {error !== null && error !== undefined && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400">
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
                options={{
                  theme: 'dark',
                }}
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              variant="outline"
              disabled={loading} 
              className="w-full h-12 border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/50 hover:text-cyan-300 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending secure code...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Send Verification Code
                </span>
              )}
            </Button>
            
            {/* Helper Text */}
            <p className="text-xs text-center text-text-muted">
              We&apos;ll send a 6-digit code to verify your identity
            </p>
          </form>
        ) : (
          /* ==================== OTP STEP ==================== */
          <div className="space-y-6">
            {/* Countdown Timer with Warning State */}
            <div className="flex justify-center">
              {countdown > 0 ? (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                  countdown <= 60 
                    ? 'bg-yellow-500/10 border border-yellow-500/30' 
                    : 'bg-cyan-glow/10 border border-cyan-glow/20'
                }`}>
                  {countdown <= 60 ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-cyan-glow animate-pulse" />
                  )}
                  <span className={`text-xs font-mono ${
                    countdown <= 60 ? 'text-yellow-500' : 'text-cyan-glow'
                  }`}>
                    {countdown <= 60 ? 'Expiring soon: ' : 'Expires in '}
                    {formatCountdown(countdown)}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-neon/30 text-purple-neon text-xs font-medium hover:bg-purple-neon/10 hover:border-purple-neon/50 hover:text-purple-300 transition-all duration-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Code expired — Send new code
                </button>
              )}
            </div>

            <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-6">
              {/* OTP Input */}
              <div className="flex flex-col items-center space-y-3">
                <label htmlFor="code" className="text-sm font-medium text-text-secondary self-start">
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
                      className="gap-2"
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot 
                          index={0} 
                          className="w-12 h-14 text-xl font-bold bg-bg-secondary/50 border-border-subtle focus:border-cyan-glow focus:ring-cyan-glow/20 text-text-primary rounded-lg transition-all duration-200"
                        />
                        <InputOTPSlot 
                          index={1} 
                          className="w-12 h-14 text-xl font-bold bg-bg-secondary/50 border-border-subtle focus:border-cyan-glow focus:ring-cyan-glow/20 text-text-primary rounded-lg transition-all duration-200"
                        />
                        <InputOTPSlot 
                          index={2} 
                          className="w-12 h-14 text-xl font-bold bg-bg-secondary/50 border-border-subtle focus:border-cyan-glow focus:ring-cyan-glow/20 text-text-primary rounded-lg transition-all duration-200"
                        />
                      </InputOTPGroup>
                      <InputOTPSeparator className="text-text-muted" />
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot 
                          index={3} 
                          className="w-12 h-14 text-xl font-bold bg-bg-secondary/50 border-border-subtle focus:border-cyan-glow focus:ring-cyan-glow/20 text-text-primary rounded-lg transition-all duration-200"
                        />
                        <InputOTPSlot 
                          index={4} 
                          className="w-12 h-14 text-xl font-bold bg-bg-secondary/50 border-border-subtle focus:border-cyan-glow focus:ring-cyan-glow/20 text-text-primary rounded-lg transition-all duration-200"
                        />
                        <InputOTPSlot 
                          index={5} 
                          className="w-12 h-14 text-xl font-bold bg-bg-secondary/50 border-border-subtle focus:border-cyan-glow focus:ring-cyan-glow/20 text-text-primary rounded-lg transition-all duration-200"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  )}
                />
                {otpForm.formState.errors.code !== null &&
                  otpForm.formState.errors.code !== undefined && (
                    <span className="text-sm text-red-400">
                      {otpForm.formState.errors.code.message}
                    </span>
                  )}
              </div>

              {/* Error Alert */}
              {error !== null && error !== undefined && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  variant="outline"
                  disabled={loading} 
                  className="w-full h-12 border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/50 hover:text-cyan-300 font-semibold transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Sign In'
                  )}
                </Button>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => {
                      setStep('email');
                      setError(null);
                      otpForm.reset();
                    }}
                    className="flex-1 h-10 border-text-muted/30 text-text-muted hover:bg-text-muted/10 hover:border-text-muted/50 hover:text-text-secondary transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => {
                      setStep('email');
                      setError(null);
                      otpForm.reset();
                      emailForm.reset();
                    }}
                    className="flex-1 h-10 border-purple-neon/30 text-purple-neon hover:bg-purple-neon/10 hover:border-purple-neon/50 hover:text-purple-300 transition-all duration-200"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    New Email
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Security Features Grid - Inside Card */}
        <div className="pt-4 mt-15 border-t border-border-subtle">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1.5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-cyan-glow/10 border border-cyan-glow/20">
                <Shield className="w-4 h-4 text-cyan-glow" />
              </div>
              <p className="text-xs text-text-muted">Encrypted</p>
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-purple-neon/10 border border-purple-neon/20">
                <Zap className="w-4 h-4 text-purple-neon" />
              </div>
              <p className="text-xs text-text-muted">Instant</p>
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-success/10 border border-green-success/20">
                <Lock className="w-4 h-4 text-green-success" />
              </div>
              <p className="text-xs text-text-muted">Passwordless</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

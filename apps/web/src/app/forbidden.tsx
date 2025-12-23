import Link from 'next/link';
import { ShieldOff, Lock, Home, LogIn, Shield } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function Forbidden(): React.ReactElement {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-dark">
      <Header />

      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-neon/5 blur-3xl" />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Error Card */}
          <div className="glass relative overflow-hidden rounded-2xl border border-orange-500/20 p-6 text-center">
            {/* Top Accent Line */}
            <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            {/* Icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10">
              <ShieldOff className="h-8 w-8 text-orange-400" strokeWidth={1.5} />
            </div>

            {/* Error Code */}
            <div className="mb-2 text-6xl font-bold text-text-primary">403</div>

            {/* Title */}
            <h1 className="mb-2 text-xl font-semibold text-text-primary">
              Access Denied
            </h1>

            {/* Description */}
            <p className="mb-4 text-sm leading-relaxed text-text-muted">
              You don&apos;t have permission to access this resource. This area requires
              elevated privileges.
            </p>

            {/* Security Badge */}
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-green-success/30 bg-green-success/10 px-3 py-1.5">
              <Shield className="h-3.5 w-3.5 text-green-success" />
              <span className="text-xs font-medium text-green-success">
                Security protocol active
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Button asChild variant="outline" className="gap-2 border-cyan-glow/30 text-cyan-glow hover:border-cyan-glow/60 hover:bg-cyan-glow/10">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <Button asChild className="gap-2 bg-cyan-glow text-bg-primary hover:bg-cyan-glow/90">
                <Link href="/auth/login">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            </div>

            {/* Helpful Info */}
            <div className="mt-5 rounded-lg border border-border-subtle bg-bg-secondary/50 p-3">
              <div className="flex items-start gap-2 text-left">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                <div className="text-xs text-text-muted">
                  <p className="mb-1 font-medium text-text-primary">Need access?</p>
                  <p>Contact your administrator or verify you&apos;re signed in with the correct account.</p>
                </div>
              </div>
            </div>

            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

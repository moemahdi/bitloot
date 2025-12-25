import { Zap, Loader2 } from 'lucide-react';

export default function Loading(): React.ReactElement {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-dark">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 animate-pulse rounded-full bg-cyan-glow/5 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-neon/5 blur-3xl" />
      </div>

      {/* Loading Content */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Animated Logo */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute -inset-4 animate-ping rounded-full bg-cyan-glow/20" />
          <div className="absolute -inset-2 animate-pulse rounded-full bg-cyan-glow/10" />
          
          {/* Logo container */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-glow/30 bg-bg-secondary">
            <Zap className="h-8 w-8 animate-pulse text-cyan-glow" fill="currentColor" />
          </div>
        </div>

        {/* Brand name */}
        <div className="text-xl font-bold tracking-tight text-text-primary">
          Bit<span className="text-cyan-glow">Loot</span>
        </div>

        {/* Loading spinner */}
        <Loader2 className="h-5 w-5 animate-spin text-cyan-glow" />
      </div>
    </div>
  );
}

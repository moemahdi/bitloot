import { Gamepad2, Loader2 } from 'lucide-react';

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
        {/* Animated Logo - same as Header */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute -inset-4 animate-ping rounded-full bg-cyan-glow/20" />
          <div className="absolute -inset-2 animate-pulse rounded-full bg-cyan-glow/10" />
          
          {/* Logo container - matching Header style */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-xl bg-linear-to-br from-cyan-glow/20 to-purple-neon/20 border border-cyan-glow/30">
            <Gamepad2 className="w-8 h-8 text-cyan-glow animate-pulse" />
            <div className="absolute inset-0 rounded-xl bg-cyan-glow/10" />
          </div>
        </div>

        {/* Brand name - same as Header */}
        <div className="text-xl font-bold tracking-tight text-text-primary">
          Bit<span className="text-cyan-glow">Loot</span>
        </div>

        {/* Loading spinner */}
        <Loader2 className="h-5 w-5 animate-spin text-cyan-glow" />
      </div>
    </div>
  );
}

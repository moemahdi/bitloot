import { Gamepad2, Loader2 } from 'lucide-react';

export function LoadingPage(): React.ReactElement {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Logo - same as Header */}
        <div className="relative">
          <div className="absolute -inset-2 animate-pulse rounded-full bg-cyan-glow/10" />
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-cyan-glow/20 to-purple-neon/20 border border-cyan-glow/30">
            <Gamepad2 className="w-6 h-6 text-cyan-glow animate-pulse" />
          </div>
        </div>
        <div className="text-lg font-bold text-text-primary">
          Bit<span className="text-cyan-glow">Loot</span>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-cyan-glow" />
        <p className="text-text-muted animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

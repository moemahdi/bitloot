'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';
import {
  Wrench,
  Clock,
  Twitter,
  MessageCircle,
  Zap,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/design-system/primitives/button';

interface MaintenanceStatusResponse {
  maintenance: boolean;
  message: string | null;
}

interface MaintenanceModeProviderProps {
  children: ReactNode;
}

/**
 * MaintenanceModeProvider
 * 
 * Wraps the entire application and shows a maintenance page when
 * the `maintenance_mode` feature flag is enabled.
 * 
 * Admin routes (/admin/*) bypass maintenance mode for operators.
 */
export function MaintenanceModeProvider({ children }: MaintenanceModeProviderProps): React.ReactElement {
  const [isClient, setIsClient] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  // Check if we're on client and determine route
  useEffect(() => {
    setIsClient(true);
    setIsAdminRoute(window.location.pathname.startsWith('/admin'));
  }, []);

  // Fetch maintenance mode status from public endpoint (no auth required)
  const { data: status, isLoading } = useQuery<MaintenanceStatusResponse>({
    queryKey: ['status', 'maintenance'],
    queryFn: async (): Promise<MaintenanceStatusResponse> => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      
      try {
        const response = await fetch(`${baseUrl}/status/maintenance`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          // If endpoint fails, assume not in maintenance
          return { maintenance: false, message: null };
        }
        
        const data = await response.json() as MaintenanceStatusResponse;
        return data;
      } catch {
        // On error, assume not in maintenance to prevent blocking
        return { maintenance: false, message: null };
      }
    },
    staleTime: 30_000, // Check every 30 seconds
    refetchInterval: 30_000, // Auto-refresh
    retry: false,
  });

  const isMaintenanceMode = status?.maintenance ?? false;

  // Don't block during SSR or loading
  if (!isClient || isLoading) {
    return <>{children}</>;
  }

  // Allow admin routes to bypass maintenance
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Show maintenance page if enabled
  if (isMaintenanceMode) {
    return <MaintenancePage message={status?.message ?? undefined} />;
  }

  return <>{children}</>;
}

/**
 * MaintenancePage
 * 
 * Beautiful neon cyberpunk maintenance page with:
 * - Animated glowing logo
 * - Status message
 * - Estimated time (optional)
 * - Social links
 * - Auto-refresh capability
 */
function MaintenancePage({ message }: { message?: string }): React.ReactElement {
  const [dots, setDots] = useState('');

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh page every 60 seconds to check if maintenance ended
  const handleRefresh = (): void => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-glow/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-neon/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-featured/5 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 217, 255, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(0, 217, 255, 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Outer Glow Ring */}
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-cyan-glow/20 blur-xl animate-pulse" />
            <div className="absolute inset-0 w-32 h-32 rounded-full border-2 border-cyan-glow/30 animate-spin-glow" style={{ animationDuration: '8s' }} />
            
            {/* Inner Icon */}
            <div className="relative w-32 h-32 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow-cyan-lg">
              <Wrench className="h-14 w-14 text-bg-primary animate-bounce-subtle" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-bold text-gradient-primary tracking-tight">
            Under Maintenance
          </h1>
          <div className="flex items-center justify-center gap-2 text-text-secondary">
            <Zap className="h-4 w-4 text-cyan-glow animate-pulse" />
            <span>Upgrading systems{dots}</span>
          </div>
        </div>

        {/* Message Card */}
        <div className="glass p-6 rounded-2xl border border-border-subtle space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-cyan-glow/10 border border-cyan-glow/30">
              <Shield className="h-6 w-6 text-cyan-glow" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-text-primary mb-1">
                We&apos;ll be back soon!
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                {message ?? 'BitLoot is currently undergoing scheduled maintenance to improve performance and add exciting new features. Your orders and account data are safe and secure.'}
              </p>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-bg-tertiary border border-border-subtle">
            <Clock className="h-4 w-4 text-purple-neon" />
            <span className="text-sm text-text-secondary">
              Estimated duration: <span className="text-purple-neon font-medium">~30 minutes</span>
            </span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap justify-center gap-4">
          <StatusBadge icon={<Shield className="h-4 w-4" />} label="Data Secure" status="success" />
          <StatusBadge icon={<Zap className="h-4 w-4" />} label="Systems Upgrading" status="warning" />
          <StatusBadge icon={<Clock className="h-4 w-4" />} label="Back Soon" status="info" />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={handleRefresh}
            className="btn-primary shadow-glow-cyan-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Again
          </Button>
          
          <div className="flex items-center gap-3">
            <a
              href="https://twitter.com/bitloot"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-bg-secondary border border-border-subtle hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all text-text-secondary hover:text-cyan-glow"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://discord.gg/bitloot"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-bg-secondary border border-border-subtle hover:border-purple-neon/50 hover:shadow-glow-purple-sm transition-all text-text-secondary hover:text-purple-neon"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-text-muted">
          Follow us on social media for real-time updates
        </p>
      </div>

      {/* Animated Corner Accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-cyan-glow/30 rounded-tl-3xl" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-purple-neon/30 rounded-tr-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-purple-neon/30 rounded-bl-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-cyan-glow/30 rounded-br-3xl" />
    </div>
  );
}

// Status Badge Component
function StatusBadge({ 
  icon, 
  label, 
  status 
}: { 
  icon: ReactNode; 
  label: string; 
  status: 'success' | 'warning' | 'info';
}): React.ReactElement {
  const statusClasses = {
    success: 'border-green-success/30 text-green-success bg-green-success/10',
    warning: 'border-orange-warning/30 text-orange-warning bg-orange-warning/10',
    info: 'border-cyan-glow/30 text-cyan-glow bg-cyan-glow/10',
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusClasses[status]}`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export default MaintenancePage;

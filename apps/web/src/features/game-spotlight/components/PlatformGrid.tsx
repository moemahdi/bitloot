'use client';

/**
 * PlatformGrid Component
 *
 * Horizontal tabs/buttons for filtering products by platform.
 * Shows platform icons with count badges.
 */

import { useMemo } from 'react';
import { cn } from '@/design-system/utils/utils';
import { Gamepad2 } from 'lucide-react';
import type { SpotlightProduct, PlatformTab } from '../types';

// Platform icon mapping (you can add SVG icons for each platform)
const PLATFORM_ICONS: Record<string, string> = {
  Steam: '🎮',
  PlayStation: '🎮',
  Xbox: '🎮',
  Nintendo: '🎮',
  PC: '💻',
  'Epic Games': '🎮',
  GOG: '🎮',
  Origin: '🎮',
  Ubisoft: '🎮',
  'Battle.net': '🎮',
};

interface PlatformGridProps {
  products: SpotlightProduct[];
  selectedPlatform: string | undefined;
  onSelectPlatform: (platform: string | undefined) => void;
  accentColor?: string;
}

export function PlatformGrid({
  products,
  selectedPlatform,
  onSelectPlatform,
  accentColor = '#00D9FF',
}: PlatformGridProps): React.JSX.Element {
  // Extract unique platforms with counts
  const platforms: PlatformTab[] = useMemo(() => {
    const platformMap = new Map<string, number>();

    for (const product of products) {
      const platform = product.platform ?? 'Other';
      platformMap.set(platform, (platformMap.get(platform) ?? 0) + 1);
    }

    return Array.from(platformMap.entries())
      .map(([id, count]) => ({
        id,
        label: id,
        icon: PLATFORM_ICONS[id] ?? '🎮',
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  if (platforms.length <= 1) {
    return <div />;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* All Platforms button */}
      <button
        onClick={() => onSelectPlatform(undefined)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
          selectedPlatform === undefined
            ? 'border-transparent bg-white/10 text-white'
            : 'border-border-subtle bg-bg-secondary/50 text-text-secondary hover:border-border-accent hover:text-white',
        )}
        style={
          selectedPlatform === undefined
            ? { borderColor: accentColor, boxShadow: `0 0 10px ${accentColor}30` }
            : undefined
        }
      >
        <Gamepad2 className="h-4 w-4" />
        <span>All</span>
        <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
          {products.length}
        </span>
      </button>

      {/* Platform buttons */}
      {platforms.map((platform) => (
        <button
          key={platform.id}
          onClick={() => onSelectPlatform(platform.id)}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
            selectedPlatform === platform.id
              ? 'border-transparent bg-white/10 text-white'
              : 'border-border-subtle bg-bg-secondary/50 text-text-secondary hover:border-border-accent hover:text-white',
          )}
          style={
            selectedPlatform === platform.id
              ? { borderColor: accentColor, boxShadow: `0 0 10px ${accentColor}30` }
              : undefined
          }
        >
          <span>{platform.icon}</span>
          <span>{platform.label}</span>
          <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
            {platform.count}
          </span>
        </button>
      ))}
    </div>
  );
}

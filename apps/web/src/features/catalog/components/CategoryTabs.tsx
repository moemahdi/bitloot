/**
 * CategoryTabs Component
 * 
 * Horizontal scrollable category navigation tabs.
 * Shows All, Games, Software, Subscriptions.
 */
'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/design-system/utils/utils';
import { 
  LayoutGrid, 
  Gamepad2, 
  Monitor, 
  Gift, 
  Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BusinessCategory } from '../types';

interface CategoryTab {
  id: BusinessCategory | 'all';
  label: string;
  icon: LucideIcon;
  color: string;
  hoverColor: string;
}

const CATEGORY_TABS: CategoryTab[] = [
  { 
    id: 'all', 
    label: 'All Products', 
    icon: LayoutGrid, 
    color: 'text-text-secondary',
    hoverColor: 'hover:text-cyan-glow',
  },
  { 
    id: 'games', 
    label: 'Games', 
    icon: Gamepad2, 
    color: 'text-cyan-glow',
    hoverColor: 'hover:text-cyan-glow',
  },
  { 
    id: 'software', 
    label: 'Software', 
    icon: Monitor, 
    color: 'text-purple-neon',
    hoverColor: 'hover:text-purple-neon',
  },
  { 
    id: 'subscriptions', 
    label: 'Subscriptions', 
    icon: Clock, 
    color: 'text-green-success',
    hoverColor: 'hover:text-green-success',
  },
];

interface CategoryTabsProps {
  activeCategory: BusinessCategory | null;
  onCategoryChange: (category: BusinessCategory | null) => void;
  categoryCounts?: Partial<Record<BusinessCategory | 'all', number>>;
  className?: string;
}

export function CategoryTabs({
  activeCategory,
  onCategoryChange,
  categoryCounts,
  className,
}: CategoryTabsProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  
  // Scroll active tab into view on mount
  useEffect(() => {
    if (activeTabRef.current !== null && scrollRef.current !== null) {
      const container = scrollRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      
      // Check if tab is outside visible area
      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeCategory]);
  
  const handleCategoryClick = (categoryId: BusinessCategory | 'all'): void => {
    if (categoryId === 'all') {
      onCategoryChange(null);
    } else {
      onCategoryChange(categoryId);
    }
  };
  
  return (
    <nav 
      className={cn('relative', className)}
      aria-label="Product categories"
    >
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hidden pb-1 -mx-4 px-4 md:mx-0 md:px-0"
      >
        {CATEGORY_TABS.map((tab) => {
          const isActive = tab.id === 'all' 
            ? activeCategory === null 
            : activeCategory === tab.id;
          const count = categoryCounts?.[tab.id];
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => handleCategoryClick(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 rounded-lg',
                'text-sm font-medium whitespace-nowrap transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
                isActive 
                  ? 'bg-bg-tertiary text-text-primary border border-cyan-glow/40 shadow-glow-cyan-sm'
                  : `bg-bg-secondary border border-border-subtle text-text-muted ${tab.hoverColor} hover:border-border-accent hover:bg-bg-tertiary`,
              )}
              aria-pressed={isActive}
              aria-label={`Filter by ${tab.label}${count !== undefined ? ` (${count} products)` : ''}`}
            >
              <Icon 
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? tab.color : 'text-current'
                )} 
                aria-hidden="true" 
              />
              <span>{tab.label}</span>
              
              {/* Product count badge */}
              {count !== undefined && (
                <span 
                  className={cn(
                    'ml-1 px-1.5 py-0.5 rounded text-xs font-medium tabular-nums',
                    isActive 
                      ? 'bg-cyan-glow/20 text-cyan-glow'
                      : 'bg-bg-tertiary text-text-muted'
                  )}
                >
                  {count > 999 ? '999+' : count}
                </span>
              )}
              
              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId="categoryTabIndicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-glow rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Fade edges on scroll (mobile) */}
      <div 
        className="absolute left-0 top-0 bottom-1 w-4 bg-gradient-to-r from-bg-primary to-transparent pointer-events-none md:hidden"
        aria-hidden="true"
      />
      <div 
        className="absolute right-0 top-0 bottom-1 w-4 bg-gradient-to-l from-bg-primary to-transparent pointer-events-none md:hidden"
        aria-hidden="true"
      />
    </nav>
  );
}

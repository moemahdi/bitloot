import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/design-system/utils/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Base layout
      'inline-flex h-11 items-center justify-center gap-1 rounded-xl p-1.5',
      // Glass morphism background
      'bg-bg-secondary/60 backdrop-blur-md',
      // Border with subtle glow
      'border border-border-subtle/50',
      // Text styling
      'text-text-muted',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base layout
      'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2',
      // Typography
      'text-sm font-medium',
      // Smooth transitions
      'transition-all duration-200 ease-out',
      // Default state
      'text-text-secondary hover:text-text-primary',
      'hover:bg-bg-tertiary/50',
      // Focus states
      'ring-offset-bg-primary',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2',
      // Disabled state
      'disabled:pointer-events-none disabled:opacity-50',
      // Active state with centered neon glow
      'data-[state=active]:bg-cyan-glow/10',
      'data-[state=active]:text-cyan-glow',
      'data-[state=active]:shadow-[0_0_20px_hsl(var(--cyan-glow)/0.3),0_0_8px_hsl(var(--cyan-glow)/0.2)]',
      'data-[state=active]:border data-[state=active]:border-cyan-glow/25',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      // Spacing
      'mt-4',
      // Animation on mount
      'data-[state=active]:animate-fade-in',
      // Focus states
      'ring-offset-bg-primary',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };

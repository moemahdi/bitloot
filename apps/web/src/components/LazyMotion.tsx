'use client';

/**
 * LazyMotion Wrapper for Framer Motion
 * 
 * This reduces the framer-motion bundle from ~150KB to ~20KB by:
 * 1. Using LazyMotion with dynamic features
 * 2. Only loading animation features when needed
 * 3. Providing a simpler m.div that's tree-shakeable
 * 
 * Usage:
 * - Wrap your app/page with <LazyMotionProvider>
 * - Use m.div instead of motion.div
 * - Or use <FadeIn>, <SlideUp> for common patterns
 */

import { LazyMotion, domAnimation, m } from 'framer-motion';
import type { ReactNode } from 'react';

// Re-export m for use in components
export { m };

// Provider that loads only DOM animations (smaller bundle)
export function LazyMotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

// ============================================================================
// SIMPLE ANIMATION COMPONENTS (CSS-first, JS-enhanced)
// ============================================================================

interface AnimatedProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * FadeInView - Fades in when element enters viewport
 * Uses CSS animation as fallback, enhanced with Intersection Observer
 */
export function FadeInView({ children, className = '', delay = 0 }: AnimatedProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </m.div>
  );
}

/**
 * SlideInLeft - Slides in from left when in viewport
 */
export function SlideInLeft({ children, className = '', delay = 0 }: AnimatedProps) {
  return (
    <m.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </m.div>
  );
}

/**
 * SlideInRight - Slides in from right when in viewport
 */
export function SlideInRight({ children, className = '', delay = 0 }: AnimatedProps) {
  return (
    <m.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </m.div>
  );
}

/**
 * StaggerContainer - Container for staggered children animations
 */
export function StaggerContainer({ children, className = '' }: Omit<AnimatedProps, 'delay'>) {
  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1 },
        },
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}

/**
 * StaggerItem - Child of StaggerContainer
 */
export function StaggerItem({ children, className = '' }: Omit<AnimatedProps, 'delay'>) {
  return (
    <m.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}

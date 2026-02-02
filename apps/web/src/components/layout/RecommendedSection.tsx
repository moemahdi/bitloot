/**
 * RecommendedSection Component
 * 
 * Client-side wrapper that renders RecommendedForYou on all marketing pages
 * EXCEPT the homepage. This is placed above the footer in the marketing layout.
 */
'use client';

import { usePathname } from 'next/navigation';
import { RecommendedForYou } from '@/features/catalog/components';

export function RecommendedSection(): React.ReactElement | null {
  const pathname = usePathname();
  
  // Don't show on homepage - it has its own featured sections
  if (pathname === '/') {
    return null;
  }
  
  return <RecommendedForYou />;
}

export default RecommendedSection;

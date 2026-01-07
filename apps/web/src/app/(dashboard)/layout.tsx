'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

/**
 * Dashboard Layout - Header + Footer
 * Used for authenticated dashboard pages (profile, admin, etc.)
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-dark safe-top safe-bottom">
      <Header />
      <main 
        id="main-content" 
        className="flex-1 focus:outline-none"
        tabIndex={-1}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}

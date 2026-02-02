import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RecommendedSection } from '@/components/layout/RecommendedSection';

/**
 * Marketing Layout - With Header/Footer
 * Used for public-facing pages (home, catalog, product, etc.)
 * 
 * Features:
 * - Neon cyberpunk background with subtle glow orbs
 * - Deep space dark theme (bg-bg-primary)
 * - Mesh gradient overlays for gaming aesthetic
 * - PWA safe area support for notched devices
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="relative min-h-screen bg-bg-primary">

      {/* Background Effects Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Top-left cyan glow orb */}
        <div 
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(190 100% 50% / 0.4) 0%, transparent 70%)',
          }}
        />
        
        {/* Top-right purple glow orb */}
        <div 
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, hsl(277 66% 59% / 0.5) 0%, transparent 70%)',
          }}
        />
        
        {/* Bottom-center pink glow orb */}
        <div 
          className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-96 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(ellipse, hsl(331 100% 50% / 0.3) 0%, transparent 70%)',
          }}
        />

        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(190 100% 50% / 0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsl(190 100% 50% / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />

        {/* Noise texture for depth */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex min-h-screen flex-col safe-top safe-bottom">
        <Header />
        
        <main 
          id="main-content" 
          className="flex-1 focus:outline-none"
          tabIndex={-1}
        >
          {children}
        </main>
        
        {/* Recommended Products Section - Shows on all pages except homepage/catalog/product */}
        <RecommendedSection />
        
        <Footer />
      </div>

      {/* Bottom gradient fade for seamless footer transition */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(to top, hsl(220 40% 7%) 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}

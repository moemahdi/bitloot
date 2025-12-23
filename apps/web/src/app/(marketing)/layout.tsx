import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

// Skip link component for accessibility (WCAG 2.4.1)
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
    >
      Skip to main content
    </a>
  );
}

/**
 * Marketing Layout - With Header/Footer
 * Used for public-facing pages (home, catalog, product, etc.)
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <>
      <SkipLink />
      <div className="relative flex min-h-screen flex-col safe-top safe-bottom">
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
    </>
  );
}

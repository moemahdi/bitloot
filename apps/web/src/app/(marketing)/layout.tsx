import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RecommendedSection } from '@/components/layout/RecommendedSection';
import { FAQSchema } from '@/components/seo';

// Note: No force-dynamic here — individual pages/layouts set their own revalidation.
// Product + category layouts use next: { revalidate } for ISR edge caching.

// FAQ items for structured data (mirrored from homepage)
const FAQ_ITEMS_FOR_SCHEMA = [
  {
    question: 'What cryptocurrencies do you accept?',
    answer: 'We accept +100 cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), USDT, USDC, Litecoin, Dogecoin, Solana, and many more. All payments are processed securely with competitive real-time exchange rates.',
  },
  {
    question: 'How fast will I receive my game key?',
    answer: 'Most orders are delivered instantly within 1-5 minutes after payment confirmation. Our fully automated system ensures lightning-fast delivery directly to your email and account dashboard.',
  },
  {
    question: 'Are the game keys legitimate and secure?',
    answer: 'Absolutely! All our keys are sourced from authorized distributors and verified before delivery. Each key is encrypted and securely stored until you reveal it. We guarantee 100% authentic, region-appropriate keys.',
  },
  {
    question: 'What is your refund policy?',
    answer: 'Due to the digital nature of our products, all sales are final once a key has been revealed. However, if you receive an invalid or already-used key, we will replace it or provide a full refund.',
  },
  {
    question: 'Can I buy without creating an account?',
    answer: 'Yes! We offer guest checkout for quick purchases. Simply enter your email, complete payment, and receive your key directly. Creating a free account gives you benefits like purchase history and wishlists.',
  },
  {
    question: 'How do I pay with Bitcoin?',
    answer: 'Simply add products to your cart, proceed to checkout, select Bitcoin as your payment method, and scan the QR code or copy the wallet address. Payment is confirmed after network confirmations.',
  },
  {
    question: 'Is my personal information safe?',
    answer: 'We prioritize your privacy. We only collect essential information for order delivery. All data is encrypted, and we never share your information with third parties. Crypto payments offer additional anonymity.',
  },
  {
    question: 'What platforms do you support?',
    answer: 'We offer game keys for Steam, Epic Games, GOG, PlayStation, Xbox, Nintendo, Origin, Ubisoft Connect, and more. Each product listing clearly shows the compatible platform.',
  },
];

/**
 * Marketing Layout - With Header/Footer
 * Used for public-facing pages (home, catalog, product, etc.)
 * 
 * Features:
 * - Neon cyberpunk background with subtle glow orbs
 * - Deep space dark theme (bg-bg-primary)
 * - Mesh gradient overlays for gaming aesthetic
 * - PWA safe area support for notched devices
 * - FAQ structured data for rich snippets
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="relative min-h-screen bg-bg-primary">
      {/* FAQ Structured Data for Google Rich Snippets */}
      <FAQSchema items={FAQ_ITEMS_FOR_SCHEMA} />

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

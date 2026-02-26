'use client';

/**
 * SpotlightPageClient Component
 *
 * Client-side component for the game spotlight page.
 * Handles state for platform filtering, cart actions, etc.
 */

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  SpotlightHero,
  PlatformGrid,
  EditionSelector,
  FeatureHighlights,
  FaqSection,
} from '@/features/game-spotlight';
import type { FaqItem } from '@/features/game-spotlight';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import {
  FileText,
  ShoppingBag,
  Shield,
  Zap,
  CreditCard,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  BitcoinIcon,
  EthereumIcon,
  TetherIcon,
  LitecoinIcon,
  SolanaIcon,
} from '@/components/crypto-icons';

interface FeatureItem {
  title: string;
  description: string;
}

interface SpotlightProduct {
  id: string;
  title: string;
  slug: string;
  platform?: string;
  region?: string;
  subtitle?: string;
  price: string;
  currency: string;
  coverImageUrl?: string;
  rating?: number;
  isPublished?: boolean;
  sourceType?: string;
}

interface SpotlightData {
  id: string;
  title: string;
  slug: string;
  description?: string;
  tagline?: string;
  coverImageUrl?: string;
  heroImageUrl?: string;
  heroVideoUrl?: string;
  accentColor?: string;
  badgeText?: string;
  releaseDate?: string;
  longDescription?: string;
  metacriticScore?: number;
  developerName?: string;
  publisherName?: string;
  genres?: string[];
  features?: Array<string | FeatureItem>;
  faqItems?: FaqItem[];
  minPrice?: string;
  maxPrice?: string;
  products?: SpotlightProduct[];
}

interface SpotlightPageClientProps {
  data: SpotlightData;
}

export function SpotlightPageClient({ data }: SpotlightPageClientProps): React.JSX.Element {
  const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>(undefined);
  const editionsRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  const scrollToEditions = useCallback(() => {
    editionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleAddToCart = useCallback(
    (product: SpotlightProduct) => {
      addItem({
        productId: product.id,
        title: product.title,
        slug: product.slug,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        quantity: 1,
        image: product.coverImageUrl ?? '',
        platform: product.platform,
      });
      toast.success(`${product.title} added to cart`);
    },
    [addItem],
  );

  const accentColor = data.accentColor ?? '#00D9FF';
  const products = data.products ?? [];
  const features: FeatureItem[] = (data.features ?? [])
    .map((item) => {
      if (typeof item === 'string') {
        const title = item.trim();
        return title !== '' ? { title, description: '' } : null;
      }

      if (item !== null && item !== undefined && typeof item.title === 'string') {
        const title = item.title.trim();
        if (title === '') {
          return null;
        }
        return {
          title,
          description: item.description?.trim() ?? '',
        };
      }

      return null;
    })
    .filter((item): item is FeatureItem => item !== null);
  const faqItems = data.faqItems ?? [];
  const primaryDescription = data.longDescription?.trim() ?? '';
  const fallbackDescription = data.description?.trim() ?? '';
  const contentDescription =
    primaryDescription !== '' ? primaryDescription : fallbackDescription;
  const descriptionBlocks = contentDescription
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter((block) => block !== '');

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg-primary">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 20% 15%, rgba(0, 217, 255, 0.15), transparent 70%), radial-gradient(ellipse 50% 35% at 85% 30%, rgba(157, 78, 221, 0.12), transparent 70%)',
        }}
      />
      {/* Hero Section */}
      <SpotlightHero
        title={data.title}
        tagline={data.tagline}
        coverImageUrl={data.coverImageUrl}
        heroImageUrl={data.heroImageUrl}
        heroVideoUrl={data.heroVideoUrl}
        accentColor={accentColor}
        badgeText={data.badgeText}
        releaseDate={data.releaseDate}
        metacriticScore={data.metacriticScore}
        developerName={data.developerName}
        publisherName={data.publisherName}
        genres={data.genres}
        minPrice={data.minPrice}
        maxPrice={data.maxPrice}
        onBuyNow={scrollToEditions}
      />

      {/* Content Sections */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:py-10">
        {/* Long Description */}
        {contentDescription !== '' && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border-accent bg-bg-secondary/70 px-3 py-1.5 shadow-card-sm backdrop-blur-sm">
              <FileText className="h-3.5 w-3.5" style={{ color: accentColor }} />
              <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Story & Overview</span>
            </div>
            <h2 className="mb-3 text-2xl font-bold text-text-primary md:text-3xl">About {data.title}</h2>
            <p className="mb-6 max-w-3xl text-sm text-text-secondary md:text-base">
              Explore the setting, core narrative, and what makes this release worth playing.
            </p>
            <div className="space-y-4 rounded-xl border border-border-accent bg-bg-secondary/40 p-5 shadow-card-md backdrop-blur-sm md:p-6">
              {descriptionBlocks.map((block, index) => (
                <p key={`${index}-${block.slice(0, 24)}`} className="leading-7 text-text-secondary">
                  {block}
                </p>
              ))}
            </div>
          </motion.section>
        )}

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
        >
          {[
            { icon: Zap, label: 'Instant Delivery', desc: 'Keys delivered in seconds' },
            { icon: Shield, label: '100% Secure', desc: 'Encrypted checkout' },
            { icon: CheckCircle2, label: 'Verified Keys', desc: 'Guaranteed authentic' },
            { icon: Lock, label: 'Safe Payment', desc: 'No chargebacks' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-secondary/40 p-3 backdrop-blur-sm transition-colors hover:border-border-accent md:p-4"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <item.icon className="h-5 w-5" style={{ color: accentColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                <p className="truncate text-xs text-text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Editions Section */}
        {products.length > 0 && (
          <motion.section
            ref={editionsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12 scroll-mt-8"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border-accent bg-bg-secondary/70 px-3 py-1.5 shadow-card-sm backdrop-blur-sm">
              <ShoppingBag className="h-3.5 w-3.5" style={{ color: accentColor }} />
              <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Available Editions</span>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-text-primary md:text-3xl">
              Choose Your Edition
            </h2>
            <p className="mb-6 max-w-2xl text-sm text-text-secondary md:text-base">
              Compare platforms and pick the edition that fits your playstyle.
            </p>

            {/* Platform Filter */}
            <div className="mb-6">
              <PlatformGrid
                products={products}
                selectedPlatform={selectedPlatform}
                onSelectPlatform={setSelectedPlatform}
                accentColor={accentColor}
              />
            </div>

            {/* Edition Cards */}
            <EditionSelector
              products={products}
              selectedPlatform={selectedPlatform}
              accentColor={accentColor}
              onAddToCart={handleAddToCart}
            />
          </motion.section>
        )}

        {/* Feature Highlights */}
        {features.length > 0 && (
          <FeatureHighlights features={features} accentColor={accentColor} />
        )}

        {/* FAQ Section */}
        {faqItems.length > 0 && (
          <FaqSection items={faqItems} accentColor={accentColor} />
        )}

        {/* Payment Methods */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative overflow-hidden rounded-2xl border border-border-accent bg-linear-to-br from-bg-secondary/60 via-bg-secondary/40 to-bg-secondary/60 p-8 shadow-card-md backdrop-blur-sm md:p-10"
        >
          {/* Background accent glow */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-15 blur-3xl"
            style={{ backgroundColor: accentColor }}
          />

          <div className="relative z-10 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-border-accent bg-bg-primary/50 px-4 py-2 backdrop-blur-sm">
              <CreditCard className="h-4 w-4" style={{ color: accentColor }} />
              <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Crypto Payment</span>
            </div>
            <h3 className="mb-3 text-xl font-bold text-text-primary md:text-2xl">
              Pay with 100+ Cryptocurrencies
            </h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-text-secondary md:text-base">
              Bitcoin, Ethereum, USDT, Litecoin, and many more. Your keys are delivered instantly after payment confirmation.
            </p>

            {/* Crypto Icons */}
            <div className="flex items-center justify-center gap-4 md:gap-6">
              {[
                { Icon: BitcoinIcon, name: 'Bitcoin' },
                { Icon: EthereumIcon, name: 'Ethereum' },
                { Icon: TetherIcon, name: 'USDT' },
                { Icon: LitecoinIcon, name: 'Litecoin' },
                { Icon: SolanaIcon, name: 'Solana' },
              ].map((crypto) => (
                <div
                  key={crypto.name}
                  className="group flex flex-col items-center gap-1.5"
                  title={crypto.name}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-subtle bg-bg-primary/60 transition-all group-hover:scale-110 group-hover:border-border-accent md:h-14 md:w-14">
                    <crypto.Icon size={28} className="transition-transform group-hover:scale-110" />
                  </div>
                  <span className="text-[10px] font-medium text-text-muted md:text-xs">{crypto.name}</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-subtle bg-bg-primary/60 md:h-14 md:w-14">
                  <span className="text-lg font-bold text-text-secondary">+95</span>
                </div>
                <span className="text-[10px] font-medium text-text-muted md:text-xs">More</span>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

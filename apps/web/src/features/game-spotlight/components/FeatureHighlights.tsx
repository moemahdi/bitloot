'use client';

/**
 * FeatureHighlights Component
 *
 * Displays a grid of feature bullet points for the game.
 * Uses checkmark icons with accent color theming.
 */

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface FeatureItem {
  title: string;
  description?: string;
}

interface FeatureHighlightsProps {
  features: Array<string | FeatureItem>;
  accentColor?: string;
}

export function FeatureHighlights({
  features,
  accentColor = '#00D9FF',
}: FeatureHighlightsProps): React.JSX.Element {
  const normalizedFeatures = features
    .map((feature) => {
      if (typeof feature === 'string') {
        const title = feature.trim();
        return title !== '' ? { title, description: '' } : null;
      }

      const title = feature.title.trim();
      if (title === '') {
        return null;
      }

      return {
        title,
        description: feature.description?.trim() ?? '',
      };
    })
    .filter((feature): feature is { title: string; description: string } => feature !== null);

  if (normalizedFeatures.length === 0) {
    return <div />;
  }

  return (
    <section className="py-12">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-secondary/60 px-3 py-1.5">
          <Sparkles className="h-3.5 w-3.5" style={{ color: accentColor }} />
          <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Game Highlights</span>
        </div>
        <h2 className="text-2xl font-bold text-text-primary md:text-3xl">Why You’ll Love This Game</h2>
        <p className="mt-2 max-w-3xl text-sm text-text-secondary md:text-base">
          Key features, gameplay strengths, and standout content included in this edition.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {normalizedFeatures.map((feature, index) => (
          <motion.div
            key={`${index}-${feature.title}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 rounded-lg border border-border-subtle bg-bg-secondary/30 p-4 backdrop-blur-sm"
          >
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Check
                className="h-4 w-4"
                style={{ color: accentColor }}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-primary">{feature.title}</p>
              {feature.description !== '' && (
                <p className="text-sm text-text-secondary">{feature.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Flame, Clock, Zap, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Design System Components
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';

// Marketing Components
import { FlashDealSection } from '@/components/marketing/FlashDealSection';
import { BundleDealsSection } from '@/components/marketing/BundleDealsSection';

/**
 * Deals Page - Combines Flash Deals and Bundle Deals
 * 
 * This page provides a dedicated landing for all promotional content,
 * making it easy for users who want to find the best prices.
 */
export default function DealsPage(): React.ReactElement {
    return (
        <main className="min-h-screen bg-bg-primary">
            {/* Hero Section */}
            <section className="relative py-16 sm:py-24 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-linear-to-b from-orange-warning/5 via-transparent to-transparent" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-warning/10 rounded-full blur-3xl" />
                <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-pink-featured/10 rounded-full blur-3xl" />

                <div className="relative container mx-auto px-4 md:px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge
                            variant="secondary"
                            className="mb-6 px-4 py-1.5 bg-orange-warning/10 border border-orange-warning/30 text-orange-warning"
                        >
                            <Flame className="w-4 h-4 mr-2" aria-hidden="true" />
                            Limited Time Offers
                        </Badge>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-text-primary mb-6">
                            Hot <span className="text-orange-warning">Deals</span> &{' '}
                            <span className="text-pink-featured">Bundles</span>
                        </h1>

                        <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
                            Save big on your favorite games, software, and digital goods.
                            Flash deals update daily, bundles offer the best value.
                        </p>

                        {/* Quick Stats */}
                        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
                            <div className="flex items-center gap-2 text-text-secondary">
                                <Clock className="w-5 h-5 text-orange-warning" />
                                <span className="text-sm">Updated Daily</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-secondary">
                                <Zap className="w-5 h-5 text-cyan-glow" />
                                <span className="text-sm">Up to 90% Off</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-secondary">
                                <Package className="w-5 h-5 text-purple-neon" />
                                <span className="text-sm">Instant Delivery</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Flash Deals Section */}
            <FlashDealSection />

            {/* Bundle Deals Section */}
            <BundleDealsSection />

            {/* CTA Section */}
            <section className="py-16 sm:py-24 bg-bg-secondary">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-2xl sm:text-3xl font-display font-bold text-text-primary mb-4">
                            Can&apos;t find what you&apos;re looking for?
                        </h2>
                        <p className="text-text-secondary mb-8 max-w-xl mx-auto">
                            Browse our full catalog with thousands of games, software,
                            and subscriptions.
                        </p>
                        <Button asChild size="lg" className="btn-primary">
                            <Link href="/catalog">
                                Browse Full Catalog
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                        </Button>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}

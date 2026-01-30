'use client';

/**
 * BitLoot Homepage - 6-Section Architecture + Supporting Sections
 * 
 * Optimized for showcasing 4 product types (Games, Software, Gift Cards, Subscriptions)
 * without overwhelming users. Each section serves a specific user intent.
 * 
 * Core Product Sections (6-Section Architecture):
 * 1. StickyFlashDealBanner - Persistent urgency (existing)
 * 2. HeroSection - Value prop + search + trust bar
 * 3. FlashDealSection - Urgency (8-12 products with countdown)
 * 4. TrendingNowGrid - Social proof (top 12 by sales)
 * 5. FeaturedByTypeSection - Equality (4 tabs for product types)
 * 6. BundleDealsSection - Upsell (existing)
 * 7. CategoryBrowser - Discovery (grouped category tiles)
 * 8. GiftCardQuickBuy - Impulse (2-click purchase)
 * 
 * Supporting Sections:
 * 9. BenefitsSection - Why choose us
 * 10. SocialProofSection - Trust + live purchases
 * 11. FAQSection - Common questions
 * 12. CTASection - Final call to action
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

// Design System Components
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Card, CardContent } from '@/design-system/primitives/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/design-system/primitives/accordion';

// Icons (Lucide only)
import {
    Zap,
    Shield,
    Star,
    ChevronRight,
    Bitcoin,
    ShoppingCart,
    Globe,
    CheckCircle,
    HelpCircle,
    MessageCircle,
    RefreshCw,
    Wallet,
} from 'lucide-react';

// Components
import { LivePurchaseFeed, TrustSection } from '@/components/SocialProof';

// Marketing Components (existing)
import { FlashDealSection, BundleDealsSection, StickyFlashDealBanner } from '@/components/marketing';

// New 6-Section Architecture Components
import {
    HeroSection,
    TrendingNowGrid,
    FeaturedByTypeSection,
    CategoryBrowser,
    GiftCardQuickBuy,
} from '@/components/homepage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BenefitCard {
    icon: LucideIcon;
    title: string;
    description: string;
    gradient: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BENEFITS: BenefitCard[] = [
    {
        icon: Bitcoin,
        title: 'Crypto Payments',
        description: 'Pay with 300+ cryptocurrencies including BTC, ETH, USDT, and more. Fast, secure, and private.',
        gradient: 'from-cyan-glow/20 to-purple-neon/20',
    },
    {
        icon: Zap,
        title: 'Instant Delivery',
        description: 'Receive your game keys within seconds. Our automated system ensures lightning-fast delivery.',
        gradient: 'from-green-success/20 to-cyan-glow/20',
    },
    {
        icon: Shield,
        title: '100% Secure',
        description: 'Bank-grade encryption protects your transactions. Keys are verified and guaranteed authentic.',
        gradient: 'from-purple-neon/20 to-pink-featured/20',
    },
    {
        icon: Globe,
        title: 'Global Access',
        description: 'No restrictions, no borders. Buy games from anywhere in the world with cryptocurrency.',
        gradient: 'from-orange-warning/20 to-pink-featured/20',
    },
];

// ============================================================================
// BENEFITS SECTION
// ============================================================================

function BenefitsSection(): React.ReactElement {
    return (
        <section className="py-20 bg-bg-secondary relative overflow-hidden">
            {/* Background decoration */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-px bg-linear-to-r from-transparent via-border-subtle to-transparent"
                aria-hidden="true"
            />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <Badge
                        variant="secondary"
                        className="mb-4 px-3 py-1 bg-green-success/10 border border-green-success/30 text-green-success"
                    >
                        <CheckCircle className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
                        Why Choose Us
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
                        The Crypto-Native Advantage
                    </h2>
                    <p className="text-text-secondary max-w-2xl mx-auto">
                        Built from the ground up for cryptocurrency payments.
                        Experience gaming commerce the way it should be.
                    </p>
                </motion.div>

                {/* Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {BENEFITS.map((benefit, index) => (
                        <motion.div
                            key={benefit.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card className="card-interactive-glow h-full bg-bg-tertiary border-border-subtle hover:border-cyan-glow/50 transition-all duration-300">
                                <CardContent className="p-6 text-center">
                                    {/* Icon */}
                                    <div
                                        className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br ${benefit.gradient} border border-border-subtle mb-5`}
                                    >
                                        <benefit.icon
                                            className="w-7 h-7 text-cyan-glow"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-lg font-display font-semibold text-text-primary mb-3">
                                        {benefit.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                        {benefit.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// SOCIAL PROOF SECTION
// ============================================================================

function _SocialProofSection(): React.ReactElement {
    return (
        <section className="py-20 bg-bg-primary relative">
            {/* Top gradient line */}
            <div
                className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-purple-neon/50 to-transparent"
                aria-hidden="true"
            />

            <div className="container mx-auto px-4 md:px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <Badge
                        variant="secondary"
                        className="mb-4 px-3 py-1 bg-pink-featured/10 border border-pink-featured/30 text-pink-featured"
                    >
                        <Star className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
                        Social Proof
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
                        Trusted by Thousands
                    </h2>
                    <p className="text-text-secondary max-w-2xl mx-auto">
                        Join our growing community of satisfied customers who trust BitLoot
                        for their gaming needs.
                    </p>
                </motion.div>

                {/* Live Purchase Feed & Trust Badges */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Live Purchases */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <LivePurchaseFeed />
                    </motion.div>

                    {/* Trust Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <TrustSection />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// FAQ SECTION
// ============================================================================

interface FAQItem {
    id: string;
    question: string;
    answer: string;
    icon: LucideIcon;
    category: 'payment' | 'delivery' | 'security' | 'general';
}

// Essential FAQs - Full list available at /help
const FAQ_ITEMS: FAQItem[] = [
    {
        id: 'crypto-payment',
        question: 'What cryptocurrencies do you accept?',
        answer: 'We accept over 300+ cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), USDT, USDC, Litecoin, Dogecoin, Solana, and many more. All payments are processed securely with competitive real-time exchange rates.',
        icon: Bitcoin,
        category: 'payment',
    },
    {
        id: 'delivery-time',
        question: 'How fast will I receive my game key?',
        answer: 'Most orders are delivered instantly within 1-5 minutes after payment confirmation. Our fully automated system ensures lightning-fast delivery directly to your email and account dashboard. For crypto payments, delivery begins once the transaction receives sufficient network confirmations.',
        icon: Zap,
        category: 'delivery',
    },
    {
        id: 'key-security',
        question: 'Are the game keys legitimate and secure?',
        answer: 'Absolutely! All our keys are sourced from authorized distributors and verified before delivery. Each key is encrypted and securely stored until you reveal it. We guarantee 100% authentic, region-appropriate keys with full activation support.',
        icon: Shield,
        category: 'security',
    },
    {
        id: 'refund-policy',
        question: 'What is your refund policy?',
        answer: "Due to the digital nature of our products, all sales are final once a key has been revealed. However, if you receive an invalid or already-used key, we'll replace it or provide a full refund. See our full Refund Policy for details.",
        icon: RefreshCw,
        category: 'general',
    },
    {
        id: 'guest-checkout',
        question: 'Can I buy without creating an account?',
        answer: 'Yes! We offer guest checkout for quick purchases. Simply enter your email, complete payment, and receive your key directly. However, creating a free account gives you benefits like purchase history, wishlists, and easy key retrieval anytime.',
        icon: Wallet,
        category: 'general',
    },
];

function FAQSection(): React.ReactElement {
    const [openItems, setOpenItems] = useState<string[]>([]);

    const categoryColors = {
        payment: { icon: 'text-purple-neon', badge: 'bg-purple-neon/10 text-purple-neon border-purple-neon/30' },
        delivery: { icon: 'text-green-success', badge: 'bg-green-success/10 text-green-success border-green-success/30' },
        security: { icon: 'text-cyan-glow', badge: 'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30' },
        general: { icon: 'text-pink-featured', badge: 'bg-pink-featured/10 text-pink-featured border-pink-featured/30' },
    };

    return (
        <section id="faq" className="relative py-20 sm:py-28 overflow-hidden scroll-mt-20">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-bg-primary" />
            <div className="absolute inset-0 bg-linear-to-b from-purple-neon/5 via-transparent to-cyan-glow/5" />
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-purple-neon/10 rounded-full blur-3xl" />
            <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-glow/10 rounded-full blur-3xl" />

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="text-center mb-12 sm:mb-16"
                >
                    <Badge
                        variant="outline"
                        className="mb-4 border-cyan-glow/30 text-cyan-glow bg-cyan-glow/10 px-4 py-1.5"
                    >
                        <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
                        FAQ
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                        <span className="text-text-primary">Frequently Asked </span>
                        <span className="text-gradient-primary">Questions</span>
                    </h2>
                    <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                        Everything you need to know about buying game keys with cryptocurrency.
                        Can&apos;t find your answer? Our support team is here 24/7.
                    </p>
                </motion.div>

                {/* FAQ Accordion */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    <Accordion
                        type="multiple"
                        value={openItems}
                        onValueChange={setOpenItems}
                        className="space-y-3"
                    >
                        {FAQ_ITEMS.map((item, index) => {
                            const IconComponent = item.icon;
                            const colors = categoryColors[item.category];
                            const isOpen = openItems.includes(item.id);

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.05,
                                        ease: [0.25, 0.46, 0.45, 0.94],
                                    }}
                                >
                                    <AccordionItem
                                        value={item.id}
                                        className={`
                                            group border rounded-xl overflow-hidden transition-all duration-300
                                            ${isOpen 
                                                ? 'bg-bg-secondary/80 border-cyan-glow/40 shadow-glow-cyan-sm' 
                                                : 'bg-bg-secondary/40 border-border-subtle hover:border-border-accent hover:bg-bg-secondary/60'
                                            }
                                        `}
                                    >
                                        <AccordionTrigger
                                            className="px-5 py-4 hover:no-underline [&[data-state=open]>div>svg:last-child]:rotate-180"
                                        >
                                            <div className="flex items-center gap-4 text-left w-full">
                                                <div className={`
                                                    shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                                                    transition-all duration-300
                                                    ${isOpen 
                                                        ? 'bg-cyan-glow/20 shadow-glow-cyan-sm' 
                                                        : 'bg-bg-tertiary group-hover:bg-cyan-glow/10'
                                                    }
                                                `}>
                                                    <IconComponent className={`
                                                        w-5 h-5 transition-colors duration-300
                                                        ${isOpen ? 'text-cyan-glow' : colors.icon}
                                                    `} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`
                                                        font-medium text-base sm:text-lg transition-colors duration-300
                                                        ${isOpen ? 'text-cyan-glow' : 'text-text-primary group-hover:text-cyan-glow'}
                                                    `}>
                                                        {item.question}
                                                    </h3>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-5 pb-5">
                                            <div className="pl-14">
                                                <p className="text-text-secondary leading-relaxed">
                                                    {item.answer}
                                                </p>
                                                <Badge
                                                    variant="outline"
                                                    className={`mt-4 text-xs ${colors.badge}`}
                                                >
                                                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                                </Badge>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </motion.div>
                            );
                        })}
                    </Accordion>
                </motion.div>

                {/* Still Have Questions CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="mt-12 text-center"
                >
                    <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-bg-secondary/60 border border-border-subtle">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-purple-neon/20 flex items-center justify-center">
                                <MessageCircle className="w-6 h-6 text-purple-neon" />
                            </div>
                            <div className="text-left">
                                <p className="text-text-primary font-medium">Need more answers?</p>
                                <p className="text-text-secondary text-sm">Visit our Help Center or contact support 24/7</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                asChild
                                variant="outline"
                                className="border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:border-cyan-glow/50"
                            >
                                <Link href="/help">
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    Help Center
                                </Link>
                            </Button>
                            <Button
                                asChild
                                className="bg-purple-neon hover:bg-purple-neon/90 text-white shadow-glow-purple-sm hover:shadow-glow-purple transition-all"
                            >
                                <Link href="/help#support">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Contact Support
                                </Link>
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ============================================================================
// CTA SECTION
// ============================================================================

function CTASection(): React.ReactElement {
    return (
        <section className="py-20 relative overflow-hidden">
            {/* Gradient Background */}
            <div
                className="absolute inset-0 bg-linear-to-br from-cyan-glow/10 via-bg-secondary to-purple-neon/10"
                aria-hidden="true"
            />

            {/* Floating Elements */}
            <motion.div
                className="absolute top-10 left-10 w-20 h-20 rounded-full bg-cyan-glow/10 blur-2xl"
                animate={{
                    y: [0, 20, 0],
                    opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                aria-hidden="true"
            />
            <motion.div
                className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-purple-neon/10 blur-3xl"
                animate={{
                    y: [0, -20, 0],
                    opacity: [0.5, 0.7, 0.5],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                aria-hidden="true"
            />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-text-primary mb-6">
                            Ready to{' '}
                            <span className="text-gradient-primary">Level Up</span>?
                        </h2>
                        <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto">
                            Start shopping with cryptocurrency today. No account required,
                            instant delivery, and prices you&apos;ll love.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                asChild
                                size="lg"
                                className="btn-primary min-w-[200px] group"
                            >
                                <Link href="/catalog">
                                    <ShoppingCart
                                        className="mr-2 h-5 w-5"
                                        aria-hidden="true"
                                    />
                                    Start Shopping
                                    <ChevronRight
                                        className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="ghost"
                                size="lg"
                                className="text-text-secondary hover:text-cyan-glow"
                            >
                                <Link href="/support">
                                    Have Questions? Contact Us
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function HomePage(): React.ReactElement {
    return (
        <main className="min-h-screen bg-bg-primary">
            {/* Persistent urgency banner at top */}
            <StickyFlashDealBanner />
            
            {/* ===== CORE PRODUCT SECTIONS (6-Section Architecture) ===== */}
            
            {/* Section 1: Hero - Value prop + search + trust indicators */}
            <HeroSection />
            
            {/* Section 2: Flash Deals - Urgency with countdown timer */}
            <FlashDealSection />
            
            {/* Section 3: Trending Now - Social proof with sales data */}
            <TrendingNowGrid />
            
            {/* Section 4: Featured by Type - Equal showcase for each product category */}
            <FeaturedByTypeSection />
            
            {/* Section 5: Bundle Deals - Upsell with cross-category bundles */}
            <BundleDealsSection />
            
            {/* Section 6: Shop by Category - Discovery with grouped tiles */}
            <CategoryBrowser />
            
            {/* Section 7: Gift Cards Quick-Buy - Impulse 2-click purchase */}
            <GiftCardQuickBuy />
            
            {/* ===== SUPPORTING SECTIONS ===== */}
            
            {/* Benefits - Why choose BitLoot */}
            <BenefitsSection />
            
            {/* Social Proof - Trust badges + live purchases (HIDDEN - component kept for future use) */}
            {/* <_SocialProofSection /> */}
            
            {/* FAQ - Common questions */}
            <FAQSection />
            
            {/* CTA - Final call to action */}
            <CTASection />
        </main>
    );
}

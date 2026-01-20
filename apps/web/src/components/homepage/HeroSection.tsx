'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Search,
    Zap,
    ChevronRight,
    Play,
    ShieldCheck,
    Clock,
    Bitcoin,
    CreditCard,
} from 'lucide-react';

// Design System Components
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';

// ============================================================================
// TRUST BAR - Compact trust indicators below CTAs
// ============================================================================

const TRUST_ITEMS = [
    { icon: Bitcoin, text: '300+ Cryptos', color: 'text-orange-400' },
    { icon: Clock, text: 'Instant Delivery', color: 'text-cyan-glow' },
    { icon: ShieldCheck, text: '100% Secure', color: 'text-green-success' },
    { icon: CreditCard, text: 'No Account Needed', color: 'text-purple-neon' },
];

function TrustBar(): React.ReactElement {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-10"
        >
            {TRUST_ITEMS.map((item, index) => (
                <div
                    key={item.text}
                    className="flex items-center gap-2 text-sm text-text-secondary"
                >
                    <item.icon className={`w-4 h-4 ${item.color}`} aria-hidden="true" />
                    <span>{item.text}</span>
                    {index < TRUST_ITEMS.length - 1 && (
                        <span className="hidden md:block ml-4 w-1 h-1 rounded-full bg-border-subtle" />
                    )}
                </div>
            ))}
        </motion.div>
    );
}

// ============================================================================
// HERO SECTION - Simplified with value prop + search
// ============================================================================

export function HeroSection(): React.ReactElement {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (searchQuery.trim() !== '') {
                void router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
            }
        },
        [searchQuery, router]
    );

    return (
        <section className="relative min-h-[70vh] overflow-hidden flex items-center">
            {/* Animated Mesh Background */}
            <div
                className="absolute inset-0 bg-mesh-gradient opacity-60"
                aria-hidden="true"
            />

            {/* Animated Gradient Orbs */}
            <motion.div
                className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-glow/10 blur-[120px]"
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                aria-hidden="true"
            />
            <motion.div
                className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-neon/10 blur-[100px]"
                animate={{
                    x: [0, -40, 0],
                    y: [0, -20, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                aria-hidden="true"
            />

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 md:px-6 py-16 text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Badge
                        variant="secondary"
                        className="mb-6 px-4 py-2 bg-cyan-glow/10 border border-cyan-glow/30 text-cyan-glow backdrop-blur-sm"
                    >
                        <Zap className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
                        Crypto-Native Game Store
                    </Badge>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight"
                >
                    <span className="text-text-primary">Buy Game Keys with</span>
                    <br />
                    <span className="text-gradient-primary">Cryptocurrency</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10"
                >
                    Instant delivery, 300+ cryptocurrencies accepted, and unbeatable prices.
                    Get your favorite games without the hassle.
                </motion.p>

                {/* Search Bar */}
                <motion.form
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    onSubmit={handleSearch}
                    className="max-w-xl mx-auto mb-8"
                >
                    <div
                        className={`relative flex items-center gap-2 p-2 rounded-2xl transition-all duration-300 ${
                            isSearchFocused
                                ? 'bg-bg-secondary border-2 border-cyan-glow shadow-glow-cyan'
                                : 'bg-bg-secondary/80 border-2 border-border-subtle'
                        }`}
                    >
                        <Search
                            className={`absolute left-5 h-5 w-5 transition-colors ${
                                isSearchFocused ? 'text-cyan-glow' : 'text-text-muted'
                            }`}
                            aria-hidden="true"
                        />
                        <Input
                            type="search"
                            placeholder="Search games, software, gift cards..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            className="flex-1 pl-12 pr-4 h-12 bg-transparent border-0 focus:ring-0 text-text-primary placeholder:text-text-muted text-base"
                            aria-label="Search games and software"
                        />
                        <Button
                            type="submit"
                            className="h-10 px-6 bg-cyan-glow hover:bg-cyan-400 text-bg-primary font-semibold rounded-xl transition-all hover:shadow-glow-cyan-sm"
                        >
                            Search
                        </Button>
                    </div>
                </motion.form>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Button
                        asChild
                        size="lg"
                        className="btn-primary min-w-[200px] group"
                    >
                        <Link href="/catalog">
                            Browse Catalog
                            <ChevronRight
                                className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                                aria-hidden="true"
                            />
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="btn-outline min-w-[200px] group"
                    >
                        <Link href="/how-it-works">
                            <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                            How It Works
                        </Link>
                    </Button>
                </motion.div>

                {/* Trust Bar */}
                <TrustBar />
            </div>

            {/* Bottom Gradient Fade */}
            <div
                className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-bg-primary to-transparent"
                aria-hidden="true"
            />
        </section>
    );
}

export default HeroSection;

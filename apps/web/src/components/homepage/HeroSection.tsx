'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Zap,
    ChevronRight,
    Play,
    ShieldCheck,
    Clock,
    Bitcoin,
    CreditCard,
    TrendingUp,
    Sparkles,
} from 'lucide-react';

// Design System Components
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';

// ============================================================================
// DYNAMIC TAGLINES - Rotating value propositions
// ============================================================================

const DYNAMIC_TAGLINES = [
    { text: 'Save Up to 80% on Top Titles', icon: TrendingUp, color: 'text-green-success' },
    { text: 'Keys & Accounts Delivered Instantly', icon: Zap, color: 'text-cyan-glow' },
    { text: 'Games • Software • Subscriptions', icon: Sparkles, color: 'text-purple-neon' },
    { text: 'Verified & Guaranteed Products', icon: ShieldCheck, color: 'text-orange-warning' },
];

function DynamicTagline(): React.ReactElement {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % DYNAMIC_TAGLINES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const current = DYNAMIC_TAGLINES[currentIndex];
    if (current === undefined || current === null) return <></>;

    return (
        <div className="h-7 relative overflow-hidden mb-4">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center justify-center gap-2 ${current.color}`}
                >
                    <current.icon className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm font-semibold">{current.text}</span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// DYNAMIC HEADLINE - Rotating product types
// ============================================================================

const HEADLINE_PRODUCTS = [
    { text: 'Game Keys', color: 'text-cyan-glow' },
    { text: 'Software Licenses', color: 'text-purple-neon' },
    { text: 'Game Accounts', color: 'text-green-success' },
    { text: 'Subscriptions', color: 'text-orange-warning' },
];

function DynamicHeadline(): React.ReactElement {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % HEADLINE_PRODUCTS.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const current = HEADLINE_PRODUCTS[currentIndex];
    if (current === undefined || current === null) return <></>;

    return (
        <span className="inline-block min-w-[280px] sm:min-w-[380px] md:min-w-[480px]">
            <AnimatePresence mode="wait">
                <motion.span
                    key={currentIndex}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={`inline-block text-gradient-primary text-glow-cyan`}
                >
                    {current.text}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}

// ============================================================================
// FLOATING GAME COVERS - Decorative elements around hero
// ============================================================================

const FLOATING_GAMES = [
    { id: 1, position: 'left-top', delay: 0, rotate: -12 },
    { id: 2, position: 'left-bottom', delay: 0.2, rotate: -8 },
    { id: 3, position: 'right-top', delay: 0.1, rotate: 8 },
    { id: 4, position: 'right-bottom', delay: 0.3, rotate: 15 },
];

function FloatingGameCovers(): React.ReactElement {
    const positionClasses: Record<string, string> = {
        'left-top': 'left-4 xl:left-16 top-[20%]',
        'left-bottom': 'left-8 xl:left-28 bottom-[25%]',
        'right-top': 'right-4 xl:right-16 top-[20%]',
        'right-bottom': 'right-8 xl:right-28 bottom-[25%]',
    };

    const gradientColors: Record<string, string> = {
        'left-top': 'from-cyan-glow/20 to-purple-neon/10',
        'left-bottom': 'from-green-success/20 to-cyan-glow/10',
        'right-top': 'from-purple-neon/20 to-pink-featured/10',
        'right-bottom': 'from-orange-warning/20 to-pink-featured/10',
    };

    return (
        <>
            {FLOATING_GAMES.map((game) => (
                <motion.div
                    key={game.id}
                    initial={{ opacity: 0, scale: 0.8, rotate: game.rotate * 1.5 }}
                    animate={{ 
                        opacity: 0.8, 
                        scale: 1,
                        rotate: game.rotate,
                        y: [0, -8, 0],
                    }}
                    transition={{ 
                        duration: 0.8, 
                        delay: game.delay,
                        y: { duration: 4 + game.id * 0.5, repeat: Infinity, ease: 'easeInOut' }
                    }}
                    className={`absolute ${positionClasses[game.position]} hidden xl:block z-0 pointer-events-none`}
                >
                    <div className={`relative w-16 h-20 2xl:w-20 2xl:h-28 rounded-lg overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br ${gradientColors[game.position]}`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white/30" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/60 via-transparent to-transparent" />
                    </div>
                </motion.div>
            ))}
        </>
    );
}

// ============================================================================
// TRUST BAR - Enhanced with colors and hover effects
// ============================================================================

const TRUST_ITEMS = [
    { icon: Bitcoin, text: '300+ Cryptos', color: 'text-orange-warning', bgColor: 'bg-orange-warning/10 hover:bg-orange-warning/20' },
    { icon: Clock, text: 'Instant Delivery', color: 'text-cyan-glow', bgColor: 'bg-cyan-glow/10 hover:bg-cyan-glow/20' },
    { icon: ShieldCheck, text: '100% Secure', color: 'text-green-success', bgColor: 'bg-green-success/10 hover:bg-green-success/20' },
    { icon: CreditCard, text: 'No Account Needed', color: 'text-purple-neon', bgColor: 'bg-purple-neon/10 hover:bg-purple-neon/20' },
];

function TrustBar(): React.ReactElement {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mt-10"
        >
            {TRUST_ITEMS.map((item, index) => (
                <motion.div
                    key={item.text}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${item.bgColor} border border-white/5 backdrop-blur-sm transition-all duration-300 cursor-default`}
                >
                    <item.icon className={`w-4 h-4 ${item.color}`} aria-hidden="true" />
                    <span className="text-sm font-medium text-text-primary">{item.text}</span>
                </motion.div>
            ))}
        </motion.div>
    );
}

// ============================================================================
// HERO SECTION - Enhanced with floating elements and dynamic taglines
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
        <section className="relative min-h-[75vh] overflow-hidden flex items-center">
            {/* Animated Mesh Background */}
            <div
                className="absolute inset-0 bg-mesh-gradient opacity-60"
                aria-hidden="true"
            />

            {/* Floating Game Covers */}
            <FloatingGameCovers />

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
            
            {/* Additional accent orb */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-cyan-glow/5 via-transparent to-transparent blur-[80px]"
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                aria-hidden="true"
            />

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 md:px-6 py-16 text-center">
                {/* Dynamic Tagline */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <DynamicTagline />
                </motion.div>

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
                        Your Digital Marketplace
                    </Badge>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight"
                >
                    <span className="text-text-primary">Get Instant</span>
                    <br />
                    <DynamicHeadline />
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10"
                >
                    Discover thousands of digital products at unbeatable prices.
                    Game keys, software licenses & premium accounts — delivered instantly.
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
                                : 'bg-bg-secondary/80 border-2 border-border-subtle hover:border-border-accent'
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
                            placeholder="Search games, software, subscriptions..."
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
                        className="btn-primary min-w-[200px] group shadow-glow-cyan-sm hover:shadow-glow-cyan"
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
                        <a href="#faq">
                            <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                            How It Works
                        </a>
                    </Button>
                </motion.div>

                {/* Trust Bar */}
                <TrustBar />
            </div>

            {/* Bottom Gradient Fade */}
            <div
                className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-bg-primary via-bg-primary/80 to-transparent"
                aria-hidden="true"
            />
        </section>
    );
}

export default HeroSection;

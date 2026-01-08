'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { catalogClient } from '@bitloot/sdk';
import type { ProductListResponseDto } from '@bitloot/sdk';
import type { LucideIcon } from 'lucide-react';

// Design System Components
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Tabs, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import { Skeleton } from '@/design-system/primitives/skeleton';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/design-system/primitives/accordion';

// Icons (Lucide only)
import {
    Search,
    Zap,
    Shield,
    Gamepad2,
    Star,
    ChevronRight,
    Package,
    Bitcoin,
    Users,
    TrendingUp,
    ShoppingCart,
    Sparkles,
    ArrowRight,
    Globe,
    Play,
    CheckCircle,
    // Category Icons
    Monitor,
    CreditCard,
    Crosshair,
    Swords,
    Compass,
    Brain,
    Gauge,
    Skull,
    Cpu,
    Trophy,
    Tent,
    BookOpen,
    Coffee,
    Palette,
    Repeat,
    Layers,
    Target,
    Gift,
    Sword,
    MousePointer,
    Grid3X3,
    BookMarked,
    LayoutGrid,
    ChevronLeft,
    Flame,
    HelpCircle,
    MessageCircle,
    Clock,
    Lock,
    RefreshCw,
    Wallet,
} from 'lucide-react';

// Components
import { ProductCard } from '@/features/catalog/components/ProductCard';
import type { Product } from '@/features/catalog/components/ProductCard';
import { StatCard } from '@/components/StatCard';
import { LivePurchaseFeed, TrustSection } from '@/components/SocialProof';
import { useCart } from '@/context/CartContext';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface HeroStat {
    icon: LucideIcon;
    value: string;
    label: string;
}

interface BenefitCard {
    icon: LucideIcon;
    title: string;
    description: string;
    gradient: string;
}

interface CategoryTab {
    id: string;
    label: string;
    icon: LucideIcon;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const HERO_STATS: HeroStat[] = [
    { icon: Users, value: '1k+', label: 'Happy Customers' },
    { icon: Package, value: '500+', label: 'Products Available' },
    { icon: Zap, value: '1-5 Minutes', label: 'Instant Delivery' },
    { icon: Shield, value: '100%', label: 'Secure Payments' },
];

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

const CATEGORY_TABS: CategoryTab[] = [
    { id: 'featured', label: 'Featured', icon: Sparkles },
    { id: 'new', label: 'New Releases', icon: TrendingUp },
    { id: 'best-sellers', label: 'Best Sellers', icon: Star },
    { id: 'games', label: 'Games', icon: Gamepad2 },
];

interface ProductCategory {
    id: string;
    label: string;
    icon: LucideIcon;
    color: 'cyan' | 'purple' | 'green' | 'pink' | 'orange';
    image?: string;
}

// Category images - gaming aesthetic with dark overlays
// Using high-quality gaming images from Unsplash (free for commercial use)
const PRODUCT_CATEGORIES: ProductCategory[] = [
    // Row 1 - Most Popular (Featured with images)
    { id: 'action-games', label: 'Action', icon: Swords, color: 'cyan', image: 'https://images.unsplash.com/photo-1620231150904-a86b9802656a?w=400&h=300&fit=crop&auto=format' },
    { id: 'fps', label: 'FPS', icon: Crosshair, color: 'purple', image: 'https://images.unsplash.com/photo-1624138123070-e5db0ddf6b26?w=400&h=300&fit=crop&auto=format' },
    { id: 'rpg', label: 'RPG', icon: Shield, color: 'green', image: 'https://images.unsplash.com/photo-1640903581708-8d491706515b?w=400&h=300&fit=crop&auto=format' },
    { id: 'adventure', label: 'Adventure', icon: Compass, color: 'pink', image: 'https://images.unsplash.com/photo-1763044655339-b58c31f55e62?w=400&h=300&fit=crop&auto=format' },
    { id: 'open-world', label: 'Open World', icon: Globe, color: 'cyan', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop&auto=format' },
    { id: 'strategy', label: 'Strategy', icon: Brain, color: 'purple', image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400&h=300&fit=crop&auto=format' },
    // Row 2 - Genre Mix
    { id: 'racing', label: 'Racing', icon: Gauge, color: 'orange', image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=300&fit=crop&auto=format' },
    { id: 'horror', label: 'Horror', icon: Skull, color: 'pink', image: 'https://images.unsplash.com/photo-1670689432767-ae7a1ce37f4f?w=400&h=300&fit=crop&auto=format' },
    { id: 'simulation', label: 'Simulation', icon: Cpu, color: 'cyan', image: 'https://images.unsplash.com/photo-1493673155827-a7617e74a0ca?w=400&h=300&fit=crop&auto=format' },
    { id: 'sport', label: 'Sports', icon: Trophy, color: 'green', image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=300&fit=crop&auto=format' },
    { id: 'survival', label: 'Survival', icon: Tent, color: 'orange', image: 'https://images.unsplash.com/photo-1625391134693-89cd9891e940?w=400&h=300&fit=crop&auto=format' },
    { id: 'mmo', label: 'MMO', icon: Users, color: 'purple', image: 'https://images.unsplash.com/photo-1546443046-ed1ce6ffd1ab?w=400&h=300&fit=crop&auto=format' },
    // Row 3 - Niche Genres
    { id: 'indie', label: 'Indie', icon: Palette, color: 'pink', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop&auto=format' },
    { id: 'casual', label: 'Casual', icon: Coffee, color: 'cyan', image: 'https://images.unsplash.com/photo-1522069213448-443a614da9b6?w=400&h=300&fit=crop&auto=format' },
    { id: 'puzzle', label: 'Puzzle', icon: Grid3X3, color: 'purple', image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=300&fit=crop&auto=format' },
    { id: 'platformer', label: 'Platformer', icon: Layers, color: 'green', image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=300&fit=crop&auto=format' },
    { id: 'fighting', label: 'Fighting', icon: Sword, color: 'orange', image: 'https://images.unsplash.com/photo-1626278664285-f796b9ee7806?w=400&h=300&fit=crop&auto=format' },
    { id: 'tps', label: 'TPS', icon: Target, color: 'cyan', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=300&fit=crop&auto=format' },
    // Row 4 - Story & Style
    { id: 'visual-novel', label: 'Visual Novel', icon: BookOpen, color: 'pink', image: 'https://images.unsplash.com/photo-1763315371311-f59468cc2ddc?w=400&h=300&fit=crop&auto=format' },
    { id: 'story-rich', label: 'Story Rich', icon: BookMarked, color: 'purple', image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=300&fit=crop&auto=format' },
    { id: 'anime', label: 'Anime', icon: Sparkles, color: 'pink', image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&auto=format' },
    { id: 'co-op', label: 'Co-op', icon: Users, color: 'green', image: 'https://www.gamespot.com/a/uploads/scale_super/1601/16018044/4622971-mc-best-co-op-2025.jpg?w=400&h=300&fit=crop&auto=format' },
    { id: 'hack-and-slash', label: 'Hack & Slash', icon: Swords, color: 'orange', image: 'https://images.unsplash.com/photo-1555861496-0666c8981751?w=400&h=300&fit=crop&auto=format' },
    { id: 'point-click', label: 'Point & Click', icon: MousePointer, color: 'cyan', image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop&auto=format' },
    // Row 5 - Other Products
    { id: 'software', label: 'Software', icon: Monitor, color: 'cyan', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop&auto=format' },
    { id: 'subscription', label: 'Subscription', icon: Repeat, color: 'purple', image: 'https://static01.nyt.com/images/2020/01/30/business/30Techfix-illo/29Techfix-illo-videoSixteenByNineJumbo1600.jpg?w=400&h=300&fit=crop&auto=format' },
    { id: 'psn-card', label: 'PSN Card', icon: CreditCard, color: 'purple', image: 'https://recharge-prd.asset.akeneo.cloud/product_assets/media/recharge_com_playstation_store_product_card.png?w=400&h=300&fit=crop&auto=format' },
    { id: 'xbox-live-gold-card', label: 'Xbox Live', icon: Gift, color: 'green', image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&h=300&fit=crop&auto=format' },
];

// ============================================================================
// UNIFIED HERO + TRENDING SECTION
// ============================================================================

function HeroWithTrendingSection(): React.ReactElement {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    // Fetch trending products
    const { data: trendingData, isLoading: isTrendingLoading } = useQuery<ProductListResponseDto>({
        queryKey: ['trending-products'],
        queryFn: () => catalogClient.findAll({ limit: 8, sort: 'rating' }),
        staleTime: 5 * 60 * 1000,
    });

    const trendingProducts: Product[] = useMemo(() => {
        if (trendingData?.data == null) return [];
        return trendingData.data.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.title,
            description: p.description ?? '',
            price: p.price,
            currency: p.currency ?? 'EUR',
            image: p.imageUrl ?? undefined,
            platform: p.platform ?? undefined,
            isAvailable: p.isPublished,
            rating: p.metacriticScore != null ? p.metacriticScore / 20 : undefined,
        }));
    }, [trendingData]);

    // Check scroll position
    const checkScroll = useCallback(() => {
        if (scrollRef.current === null) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        const itemWidth = 180 + 12;
        const newIndex = Math.round(scrollLeft / itemWidth);
        setActiveIndex(Math.min(newIndex, Math.max(0, trendingProducts.length - 1)));
    }, [trendingProducts.length]);

    useEffect(() => {
        checkScroll();
        const scrollEl = scrollRef.current;
        if (scrollEl !== null) {
            scrollEl.addEventListener('scroll', checkScroll);
            return () => scrollEl.removeEventListener('scroll', checkScroll);
        }
    }, [checkScroll]);

    const scroll = useCallback((direction: 'left' | 'right') => {
        if (scrollRef.current === null) return;
        const scrollAmount = 192 * 2;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    }, []);

    // Auto-scroll effect
    useEffect(() => {
        if (trendingProducts.length === 0) return;
        const interval = setInterval(() => {
            if (scrollRef.current === null) return;
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            if (scrollLeft >= scrollWidth - clientWidth - 10) {
                scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                scroll('right');
            }
        }, 4000);
        return () => clearInterval(interval);
    }, [trendingProducts.length, scroll]);

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
        <section className="relative min-h-screen overflow-hidden">
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
            <div className="relative z-10 container mx-auto px-4 md:px-6 py-20 text-center">
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
                            placeholder="Search 10,000+ games and software..."
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
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
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

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
                >
                    {HERO_STATS.map((stat) => (
                        <StatCard
                            key={stat.label}
                            icon={stat.icon}
                            value={stat.value}
                            label={stat.label}
                        />
                    ))}
                </motion.div>
            </div>

            {/* Trending Products Section - Integrated with Hero */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="relative z-10 pb-16"
            >
                <div className="container mx-auto px-4 md:px-6">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-warning/20 to-pink-featured/20 border border-orange-warning/30 animate-glow-pulse">
                                <Flame className="w-5 h-5 text-orange-warning" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-display font-bold text-text-primary flex items-center gap-2">
                                    Trending Now
                                    <Badge className="bg-gradient-to-r from-orange-warning to-pink-featured text-white border-0 text-xs animate-pulse-ring">
                                        HOT
                                    </Badge>
                                </h2>
                                <p className="text-sm text-text-muted hidden sm:block">
                                    Most popular games this week
                                </p>
                            </div>
                        </div>

                        {/* Navigation Arrows */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => scroll('left')}
                                disabled={!canScrollLeft}
                                className="h-9 w-9 rounded-lg border-border-subtle bg-bg-secondary/50 backdrop-blur-sm disabled:opacity-30 hover:bg-bg-secondary hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all"
                                aria-label="Scroll left"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => scroll('right')}
                                disabled={!canScrollRight}
                                className="h-9 w-9 rounded-lg border-border-subtle bg-bg-secondary/50 backdrop-blur-sm disabled:opacity-30 hover:bg-bg-secondary hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all"
                                aria-label="Scroll right"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Slider Container */}
                    <div className="relative">
                        {/* Left fade gradient */}
                        <div
                            className={`absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-bg-primary via-bg-primary/80 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}
                            aria-hidden="true"
                        />
                        {/* Right fade gradient */}
                        <div
                            className={`absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-bg-primary via-bg-primary/80 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}
                            aria-hidden="true"
                        />

                        {/* Scrollable container */}
                        {isTrendingLoading ? (
                            <div className="flex gap-3 overflow-hidden">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="shrink-0 w-[160px] md:w-[180px]">
                                        <div className="relative rounded-xl overflow-hidden bg-bg-secondary border border-border-subtle">
                                            <Skeleton className="aspect-3/4" />
                                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/90 to-transparent">
                                                <Skeleton className="h-4 w-3/4 mb-2" />
                                                <Skeleton className="h-5 w-1/2" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : trendingProducts.length > 0 ? (
                            <div
                                ref={scrollRef}
                                className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mx-4 px-4"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {trendingProducts.map((product, index) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            duration: 0.4,
                                            delay: Math.min(index * 0.05, 0.3),
                                            ease: [0.25, 0.46, 0.45, 0.94],
                                        }}
                                        className="shrink-0 w-[160px] md:w-[180px]"
                                    >
                                        <Link href={`/product/${product.slug}`} className="block group">
                                            <motion.div
                                                whileHover={{ y: -6, scale: 1.02 }}
                                                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                className="relative rounded-xl overflow-hidden bg-bg-secondary border border-border-subtle group-hover:border-cyan-glow/50 group-hover:shadow-glow-cyan transition-all duration-300"
                                            >
                                                {/* Product Image */}
                                                <div className="aspect-3/4 relative overflow-hidden">
                                                    <div
                                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                                        style={{ backgroundImage: `url(${product.image ?? '/placeholder-game.jpg'})` }}
                                                    />
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/30 to-transparent" />

                                                    {/* Trending rank badge */}
                                                    <div className="absolute top-2 left-2">
                                                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-orange-warning to-pink-featured text-white text-xs font-bold shadow-lg shadow-orange-warning/30">
                                                            <Flame className="w-3 h-3" aria-hidden="true" />
                                                            #{index + 1}
                                                        </div>
                                                    </div>

                                                    {/* Platform badge */}
                                                    {product.platform !== undefined && (
                                                        <div className="absolute top-2 right-2">
                                                            <Badge className="bg-purple-neon/90 text-white border-0 text-[10px] px-1.5 py-0.5 shadow-glow-purple-sm">
                                                                {product.platform}
                                                            </Badge>
                                                        </div>
                                                    )}

                                                    {/* Product info overlay */}
                                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                                        <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 drop-shadow-lg">
                                                            {product.name}
                                                        </h3>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-base font-bold text-cyan-glow drop-shadow-lg">
                                                                {product.currency === 'EUR' ? '€' : '$'}{product.price}
                                                            </span>
                                                            {product.rating !== undefined && (
                                                                <span className="flex items-center gap-1 text-xs text-yellow-400">
                                                                    <Star className="w-3 h-3 fill-current" />
                                                                    {product.rating.toFixed(1)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Hover overlay with quick action */}
                                                    <div className="absolute inset-0 bg-cyan-glow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                        <div className="px-3 py-1.5 rounded-lg bg-bg-primary/90 backdrop-blur-sm border border-cyan-glow/50 text-cyan-glow text-xs font-medium opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-glow-cyan-sm">
                                                            View Details
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {/* Progress dots */}
                    {trendingProducts.length > 0 && (
                        <div className="flex items-center justify-center gap-1.5 mt-4">
                            {Array.from({ length: Math.min(Math.ceil(trendingProducts.length / 2), 5) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (scrollRef.current !== null) {
                                            const scrollAmount = i * 192 * 2;
                                            scrollRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
                                        }
                                    }}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        Math.floor(activeIndex / 2) === i
                                            ? 'w-8 bg-gradient-to-r from-cyan-glow to-purple-neon shadow-glow-cyan-sm'
                                            : 'w-1.5 bg-border-subtle hover:bg-text-muted'
                                    }`}
                                    aria-label={`Go to slide group ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Bottom Gradient Fade */}
            <div
                className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-bg-primary to-transparent"
                aria-hidden="true"
            />
        </section>
    );
}

// ============================================================================
// FEATURED PRODUCTS SECTION
// ============================================================================


function ProductCardSkeletonGrid(): React.ReactElement {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden bg-bg-secondary border-border-subtle">
                    <Skeleton className="aspect-3/4" />
                    <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex justify-between items-center pt-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function EmptyProductsState(): React.ReactElement {
    return (
        <div className="empty-state py-16">
            <div className="empty-state-icon">
                <Package className="w-12 h-12" aria-hidden="true" />
            </div>
            <h3 className="empty-state-title">No products found</h3>
            <p className="empty-state-description">
                Check back soon for new products in this category.
            </p>
            <Button asChild className="mt-4">
                <Link href="/catalog">Browse All Products</Link>
            </Button>
        </div>
    );
}

function ErrorState({ message }: { message: string }): React.ReactElement {
    return (
        <div className="empty-state py-16">
            <div className="empty-state-icon text-red-error">
                <Shield className="w-12 h-12" aria-hidden="true" />
            </div>
            <h3 className="empty-state-title text-red-error">Something went wrong</h3>
            <p className="empty-state-description">{message}</p>
            <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
            >
                Try Again
            </Button>
        </div>
    );
}

function FeaturedProductsSection(): React.ReactElement {
    const [activeTab, setActiveTab] = useState('featured');
    const router = useRouter();
    const { addItem } = useCart();

    // Handle Add to Cart
    const handleAddToCart = useCallback((product: Product) => {
        addItem({
            productId: product.id,
            title: product.name,
            price: parseFloat(product.price),
            quantity: 1,
            image: product.image,
        });
    }, [addItem]);

    // Handle Buy Now - Add to cart and navigate to checkout
    const handleBuyNow = useCallback((product: Product) => {
        addItem({
            productId: product.id,
            title: product.name,
            price: parseFloat(product.price),
            quantity: 1,
            image: product.image,
        });
        router.push('/checkout');
    }, [addItem, router]);

    // Map tab to API params
    const getQueryParams = useCallback((tabId: string) => {
        switch (tabId) {
            case 'featured':
                return { featured: true, limit: 8 };
            case 'new':
                return { sort: 'newest' as const, limit: 8 };
            case 'best-sellers':
                return { sort: 'rating' as const, limit: 8 };
            case 'games':
                return { category: 'games', limit: 8 };
            default:
                return { limit: 8 };
        }
    }, []);

    // Fetch products based on active tab
    const {
        data: productsData,
        isLoading,
        isError,
        error,
    } = useQuery<ProductListResponseDto>({
        queryKey: ['homepage-products', activeTab],
        queryFn: () => catalogClient.findAll(getQueryParams(activeTab)),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // Transform API response to ProductCard format
    const products: Product[] = useMemo(() => {
        if (productsData?.data == null) return [];
        return productsData.data.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.title,
            description: p.description ?? '',
            price: p.price,
            currency: p.currency ?? 'EUR',
            image: p.imageUrl ?? undefined,
            platform: p.platform ?? undefined,
            isAvailable: p.isPublished,
            rating: p.metacriticScore != null ? p.metacriticScore / 20 : undefined, // Convert 0-100 to 0-5
        }));
    }, [productsData]);

    return (
        <section className="py-20 bg-bg-primary relative">
            {/* Subtle background gradient */}
            <div
                className="absolute inset-0 bg-linear-to-b from-transparent via-cyan-glow/2 to-transparent pointer-events-none"
                aria-hidden="true"
            />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
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
                        className="mb-4 px-3 py-1 bg-purple-neon/10 border border-purple-neon/30 text-purple-neon"
                    >
                        <Sparkles className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
                        Discover
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
                        Featured Products
                    </h2>
                    <p className="text-text-secondary max-w-2xl mx-auto">
                        Hand-picked games and software at unbeatable crypto prices.
                        Updated daily with new arrivals.
                    </p>
                </motion.div>

                {/* Category Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <div className="flex justify-center mb-8">
                        <TabsList className="inline-flex p-1 bg-bg-secondary/50 border border-border-subtle rounded-xl backdrop-blur-sm">
                            {CATEGORY_TABS.map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-cyan-glow data-[state=active]:text-bg-primary data-[state=active]:shadow-glow-cyan-sm text-text-muted hover:text-text-primary"
                                >
                                    <tab.icon className="w-4 h-4" aria-hidden="true" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* Products Grid */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {isLoading ? (
                                <ProductCardSkeletonGrid />
                            ) : isError ? (
                                <ErrorState
                                    message={
                                        error instanceof Error
                                            ? error.message
                                            : 'Failed to load products'
                                    }
                                />
                            ) : products.length === 0 ? (
                                <EmptyProductsState />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.map((product, index) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onAddToCart={handleAddToCart}
                                            onBuyNow={handleBuyNow}
                                            isAboveFold={index < 4}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </Tabs>

                {/* View All Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-center mt-12"
                >
                    <Button asChild variant="outline" size="lg" className="group">
                        <Link href="/catalog">
                            View All Products
                            <ArrowRight
                                className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                                aria-hidden="true"
                            />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}

// ============================================================================
// CATEGORIES SECTION
// ============================================================================

function CategoriesSection(): React.ReactElement {
    const colorVariants = {
        cyan: {
            bg: 'bg-cyan-glow/5',
            border: 'border-cyan-glow/20',
            hoverBorder: 'group-hover:border-cyan-glow/50',
            icon: 'text-cyan-glow',
            glow: 'group-hover:shadow-glow-cyan-sm',
            gradient: 'from-cyan-glow/10 to-transparent',
        },
        purple: {
            bg: 'bg-purple-neon/5',
            border: 'border-purple-neon/20',
            hoverBorder: 'group-hover:border-purple-neon/50',
            icon: 'text-purple-neon',
            glow: 'group-hover:shadow-glow-purple-sm',
            gradient: 'from-purple-neon/10 to-transparent',
        },
        green: {
            bg: 'bg-green-success/5',
            border: 'border-green-success/20',
            hoverBorder: 'group-hover:border-green-success/50',
            icon: 'text-green-success',
            glow: 'group-hover:shadow-glow-success',
            gradient: 'from-green-success/10 to-transparent',
        },
        pink: {
            bg: 'bg-pink-featured/5',
            border: 'border-pink-featured/20',
            hoverBorder: 'group-hover:border-pink-featured/50',
            icon: 'text-pink-featured',
            glow: 'group-hover:shadow-glow-pink',
            gradient: 'from-pink-featured/10 to-transparent',
        },
        orange: {
            bg: 'bg-orange-warning/5',
            border: 'border-orange-warning/20',
            hoverBorder: 'group-hover:border-orange-warning/50',
            icon: 'text-orange-warning',
            glow: 'group-hover:shadow-[0_0_15px_hsl(25_100%_50%/0.3)]',
            gradient: 'from-orange-warning/10 to-transparent',
        },
    };

    return (
        <section className="py-20 bg-bg-primary relative overflow-hidden">
            {/* Background decoration */}
            <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-purple-neon/5 via-transparent to-transparent opacity-50"
                aria-hidden="true"
            />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
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
                        className="mb-4 px-3 py-1 bg-cyan-glow/10 border border-cyan-glow/30 text-cyan-glow"
                    >
                        <LayoutGrid className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
                        Browse by Category
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
                        Explore Our Collection
                    </h2>
                    <p className="text-text-secondary max-w-2xl mx-auto">
                        From action-packed shooters to relaxing simulations.
                        Find your next favorite game.
                    </p>
                </motion.div>

                {/* Categories Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4"
                >
                    {PRODUCT_CATEGORIES.map((category, index) => {
                        const colors = colorVariants[category.color];
                        const Icon = category.icon;
                        const hasImage = category.image !== undefined && category.image.length > 0;

                        return (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{
                                    duration: 0.3,
                                    delay: Math.min(index * 0.02, 0.3),
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                }}
                            >
                                <Link
                                    href={`/catalog?category=${category.id}`}
                                    className="block"
                                >
                                    <motion.div
                                        whileHover={{ y: -4 }}
                                        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        className={`group relative flex flex-col items-center justify-center ${hasImage ? 'h-28 md:h-32' : 'p-4 md:p-5'} rounded-xl border ${colors.bg} ${colors.border} ${colors.hoverBorder} ${colors.glow} transition-all duration-300 cursor-pointer overflow-hidden`}
                                    >
                                        {/* Background Image */}
                                        {hasImage && (
                                            <>
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                                    style={{ backgroundImage: `url(${category.image})` }}
                                                    aria-hidden="true"
                                                />
                                                {/* Dark overlay for readability */}
                                                <div
                                                    className="absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-black/30 group-hover:from-black/80 group-hover:via-black/50 group-hover:to-black/20 transition-all duration-300"
                                                    aria-hidden="true"
                                                />
                                                {/* Color tint on hover */}
                                                <div
                                                    className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-40 transition-opacity duration-300`}
                                                    aria-hidden="true"
                                                />
                                            </>
                                        )}

                                        {/* Subtle gradient overlay (for non-image cards) */}
                                        {!hasImage && (
                                            <div
                                                className={`absolute inset-0 bg-linear-to-b ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                                aria-hidden="true"
                                            />
                                        )}

                                        {/* Icon Container */}
                                        <div className={`relative z-10 ${hasImage ? 'mb-1' : 'mb-2 md:mb-3'}`}>
                                            <div className={`${hasImage ? 'w-9 h-9 md:w-10 md:h-10' : 'w-10 h-10 md:w-12 md:h-12'} rounded-lg ${hasImage ? 'bg-black/50 backdrop-blur-sm border border-white/10' : colors.bg} flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${hasImage ? 'group-hover:bg-black/70' : ''}`}>
                                                <Icon className={`${hasImage ? 'w-4 h-4 md:w-5 md:h-5' : 'w-5 h-5 md:w-6 md:h-6'} ${hasImage ? 'text-white' : colors.icon} transition-all duration-300 ${hasImage ? `group-hover:${colors.icon}` : ''}`} />
                                            </div>
                                        </div>

                                        {/* Label */}
                                        <span className={`relative z-10 text-xs md:text-sm font-medium ${hasImage ? 'text-white drop-shadow-lg' : 'text-text-primary'} text-center leading-tight group-hover:text-white transition-colors duration-300`}>
                                            {category.label}
                                        </span>

                                        {/* Glow effect indicator for image cards */}
                                        {hasImage && (
                                            <div
                                                className={`absolute inset-x-0 bottom-0 h-1 bg-linear-to-r ${colors.gradient.replace('to-transparent', `via-${category.color === 'cyan' ? 'cyan-glow' : category.color === 'purple' ? 'purple-neon' : category.color === 'green' ? 'green-success' : category.color === 'pink' ? 'pink-featured' : 'orange-warning'} to-transparent`)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                                aria-hidden="true"
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* View All Categories Link */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-center mt-10"
                >
                    <Button asChild variant="outline" className="group">
                        <Link href="/catalog">
                            View All Products
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}

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

function SocialProofSection(): React.ReactElement {
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

const FAQ_ITEMS: FAQItem[] = [
    {
        id: 'crypto-payment',
        question: 'What cryptocurrencies do you accept?',
        answer: 'We accept over 300+ cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), USDT, USDC, Litecoin, Dogecoin, and many more. Our payment processor NOWPayments ensures secure and fast transactions with competitive exchange rates.',
        icon: Bitcoin,
        category: 'payment',
    },
    {
        id: 'delivery-time',
        question: 'How fast will I receive my game key?',
        answer: 'Most orders are delivered instantly within 1-5 minutes after payment confirmation. Our automated system ensures lightning-fast delivery directly to your email and account dashboard. For crypto payments, delivery begins once the transaction receives sufficient confirmations.',
        icon: Zap,
        category: 'delivery',
    },
    {
        id: 'key-security',
        question: 'Are the game keys legitimate and secure?',
        answer: 'Absolutely! All our keys are sourced from authorized distributors and verified before delivery. Each key is encrypted and delivered through secure Cloudflare R2 signed URLs. We guarantee 100% authentic, region-appropriate keys with full activation support.',
        icon: Shield,
        category: 'security',
    },
    {
        id: 'refund-policy',
        question: 'What is your refund policy?',
        answer: "Due to the digital nature of our products, we cannot offer refunds once a key has been revealed. However, if you receive an invalid or already-used key, we'll replace it immediately or provide a full refund. Our support team is available 24/7 to assist with any issues.",
        icon: RefreshCw,
        category: 'general',
    },
    {
        id: 'payment-confirmation',
        question: 'How long do crypto payments take to confirm?',
        answer: 'Confirmation times vary by cryptocurrency. Bitcoin typically requires 1-3 confirmations (10-30 minutes), while faster networks like Litecoin or stablecoins (USDT, USDC) confirm in under 5 minutes. We monitor all transactions and begin processing immediately upon confirmation.',
        icon: Clock,
        category: 'payment',
    },
    {
        id: 'account-security',
        question: 'How do you protect my account and purchases?',
        answer: 'Your security is our priority. We use bank-grade encryption for all transactions, secure OTP authentication for account access, and encrypted key storage. Purchase history and keys are safely stored in your account and can be accessed anytime.',
        icon: Lock,
        category: 'security',
    },
    {
        id: 'payment-methods',
        question: 'Do you accept credit cards or PayPal?',
        answer: "BitLoot is a crypto-only marketplace, which allows us to offer better prices, instant global access, and enhanced privacy. We don't currently accept traditional payment methods, but converting fiat to crypto is easy through exchanges like Coinbase, Binance, or Kraken.",
        icon: Wallet,
        category: 'payment',
    },
    {
        id: 'support',
        question: 'How can I contact customer support?',
        answer: 'Our support team is available 24/7 via live chat on the website, email at support@bitloot.com, or through our Discord community. For order-related issues, please have your order ID ready. Average response time is under 2 hours.',
        icon: MessageCircle,
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
        <section className="relative py-20 sm:py-28 overflow-hidden">
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
                                <p className="text-text-primary font-medium">Still have questions?</p>
                                <p className="text-text-secondary text-sm">Our team is here to help 24/7</p>
                            </div>
                        </div>
                        <Button
                            asChild
                            className="bg-purple-neon hover:bg-purple-neon/90 text-white shadow-glow-purple-sm hover:shadow-glow-purple transition-all"
                        >
                            <Link href="/support">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Contact Support
                            </Link>
                        </Button>
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
            <HeroWithTrendingSection />
            <FeaturedProductsSection />
            <CategoriesSection />
            <BenefitsSection />
            <SocialProofSection />
            <FAQSection />
            <CTASection />
        </main>
    );
}

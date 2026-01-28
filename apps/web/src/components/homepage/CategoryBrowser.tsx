'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    LayoutGrid,
    Gamepad2,
    Monitor,
    CreditCard,
    ArrowRight,
    // Game Genres
    Swords,
    Crosshair,
    Shield,
    Compass,
    Globe,
    Brain,
    Gauge,
    Skull,
    Trophy,
    Tent,
    Users,
    Palette,
    // Platforms
    Play,
    Laptop,
    Tv,
    // Software
    FileText,
    Lock,
    PenTool,
    Wrench,
    // Gift Cards
    ShoppingBag,
    Music,
    Utensils,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Design System Components
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Category {
    id: string;
    label: string;
    icon: LucideIcon;
    href: string;
}

interface CategoryGroup {
    id: string;
    label: string;
    icon: LucideIcon;
    color: 'cyan' | 'purple' | 'green' | 'pink';
    categories: Category[];
}

// ============================================================================
// CONSTANTS - Category Groups
// ============================================================================

const CATEGORY_GROUPS: CategoryGroup[] = [
    {
        id: 'game-genres',
        label: 'Game Genres',
        icon: Gamepad2,
        color: 'cyan',
        categories: [
            { id: 'action', label: 'Action', icon: Swords, href: '/catalog?category=games&genre=action' },
            { id: 'shooter', label: 'Shooter', icon: Crosshair, href: '/catalog?category=games&genre=shooter' },
            { id: 'rpg', label: 'RPG', icon: Shield, href: '/catalog?category=games&genre=rpg' },
            { id: 'adventure', label: 'Adventure', icon: Compass, href: '/catalog?category=games&genre=adventure' },
            { id: 'open-world', label: 'Open World', icon: Globe, href: '/catalog?category=games&genre=open-world' },
            { id: 'strategy', label: 'Strategy', icon: Brain, href: '/catalog?category=games&genre=strategy' },
            { id: 'racing', label: 'Racing', icon: Gauge, href: '/catalog?category=games&genre=racing' },
            { id: 'horror', label: 'Horror', icon: Skull, href: '/catalog?category=games&genre=horror' },
            { id: 'sports', label: 'Sports', icon: Trophy, href: '/catalog?category=games&genre=sports' },
            { id: 'survival', label: 'Survival', icon: Tent, href: '/catalog?category=games&genre=survival' },
            { id: 'mmo', label: 'MMO', icon: Users, href: '/catalog?category=games&genre=mmo' },
            { id: 'indie', label: 'Indie', icon: Palette, href: '/catalog?category=games&genre=indie' },
        ],
    },
    {
        id: 'platforms',
        label: 'Gaming Platforms',
        icon: Tv,
        color: 'purple',
        categories: [
            { id: 'Steam', label: 'Steam', icon: Play, href: '/catalog?category=games&platform=Steam' },
            { id: 'PlayStation', label: 'PlayStation', icon: Gamepad2, href: '/catalog?category=games&platform=PlayStation' },
            { id: 'Xbox', label: 'Xbox', icon: Gamepad2, href: '/catalog?category=games&platform=Xbox' },
            { id: 'Nintendo', label: 'Nintendo', icon: Gamepad2, href: '/catalog?category=games&platform=Nintendo' },
            { id: 'Epic', label: 'Epic Games', icon: Play, href: '/catalog?category=games&platform=Epic' },
            { id: 'Origin', label: 'EA / Origin', icon: Play, href: '/catalog?category=games&platform=Origin' },
            { id: 'Uplay', label: 'Ubisoft', icon: Play, href: '/catalog?category=games&platform=Uplay' },
            { id: 'GOG', label: 'GOG', icon: Play, href: '/catalog?category=games&platform=GOG' },
        ],
    },
    {
        id: 'software',
        label: 'Software',
        icon: Monitor,
        color: 'green',
        categories: [
            { id: 'productivity', label: 'Productivity', icon: FileText, href: '/catalog?category=software&type=productivity' },
            { id: 'security', label: 'Security', icon: Lock, href: '/catalog?category=software&type=security' },
            { id: 'creative', label: 'Creative', icon: PenTool, href: '/catalog?category=software&type=creative' },
            { id: 'utilities', label: 'Utilities', icon: Wrench, href: '/catalog?category=software&type=utilities' },
        ],
    },
    {
        id: 'gift-cards',
        label: 'Gift Cards',
        icon: CreditCard,
        color: 'pink',
        categories: [
            { id: 'gaming-cards', label: 'Gaming', icon: Gamepad2, href: '/catalog?category=gift-cards&type=gaming' },
            { id: 'entertainment', label: 'Entertainment', icon: Music, href: '/catalog?category=gift-cards&type=entertainment' },
            { id: 'shopping', label: 'Shopping', icon: ShoppingBag, href: '/catalog?category=gift-cards&type=shopping' },
            { id: 'food', label: 'Food & Dining', icon: Utensils, href: '/catalog?category=gift-cards&type=food' },
        ],
    },
];

// ============================================================================
// COLOR CLASSES
// ============================================================================

const colorClasses = {
    cyan: {
        groupIcon: 'bg-cyan-glow/10 border-cyan-glow/30 text-cyan-glow',
        categoryBg: 'bg-cyan-glow/5 hover:bg-cyan-glow/10',
        categoryBorder: 'border-cyan-glow/20 hover:border-cyan-glow/40',
        categoryIcon: 'text-cyan-glow',
        glow: 'hover:shadow-glow-cyan-sm',
    },
    purple: {
        groupIcon: 'bg-purple-neon/10 border-purple-neon/30 text-purple-neon',
        categoryBg: 'bg-purple-neon/5 hover:bg-purple-neon/10',
        categoryBorder: 'border-purple-neon/20 hover:border-purple-neon/40',
        categoryIcon: 'text-purple-neon',
        glow: 'hover:shadow-glow-purple-sm',
    },
    green: {
        groupIcon: 'bg-green-success/10 border-green-success/30 text-green-success',
        categoryBg: 'bg-green-success/5 hover:bg-green-success/10',
        categoryBorder: 'border-green-success/20 hover:border-green-success/40',
        categoryIcon: 'text-green-success',
        glow: 'hover:shadow-glow-success',
    },
    pink: {
        groupIcon: 'bg-pink-featured/10 border-pink-featured/30 text-pink-featured',
        categoryBg: 'bg-pink-featured/5 hover:bg-pink-featured/10',
        categoryBorder: 'border-pink-featured/20 hover:border-pink-featured/40',
        categoryIcon: 'text-pink-featured',
        glow: 'hover:shadow-glow-pink',
    },
};

// ============================================================================
// CATEGORY TILE COMPONENT
// ============================================================================

interface CategoryTileProps {
    category: Category;
    color: 'cyan' | 'purple' | 'green' | 'pink';
    index: number;
}

function CategoryTile({ category, color, index }: CategoryTileProps): React.ReactElement {
    const colors = colorClasses[color];
    const Icon = category.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
        >
            <Link href={category.href}>
                <motion.div
                    whileHover={{ y: -3, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${colors.categoryBg} ${colors.categoryBorder} ${colors.glow}`}
                >
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${colors.categoryBg} border ${colors.categoryBorder}`}>
                        <Icon className={`w-4 h-4 ${colors.categoryIcon}`} aria-hidden="true" />
                    </div>
                    <span className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">
                        {category.label}
                    </span>
                    <ArrowRight className="ml-auto w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 group-hover:text-white transition-all -translate-x-2 group-hover:translate-x-0" />
                </motion.div>
            </Link>
        </motion.div>
    );
}

// ============================================================================
// CATEGORY GROUP COMPONENT
// ============================================================================

interface CategoryGroupSectionProps {
    group: CategoryGroup;
    index: number;
}

function CategoryGroupSection({ group, index }: CategoryGroupSectionProps): React.ReactElement {
    const colors = colorClasses[group.color];
    const Icon = group.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="space-y-4"
        >
            {/* Group Header */}
            <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${colors.groupIcon}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-display font-semibold text-text-primary">
                    {group.label}
                </h3>
                <Badge variant="secondary" className={`ml-auto ${colors.groupIcon} text-xs`}>
                    {group.categories.length}
                </Badge>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {group.categories.map((category, catIndex) => (
                    <CategoryTile
                        key={category.id}
                        category={category}
                        color={group.color}
                        index={catIndex}
                    />
                ))}
            </div>
        </motion.div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CategoryBrowser(): React.ReactElement {
    return (
        <section className="py-20 bg-bg-secondary relative overflow-hidden">
            {/* Background decoration */}
            <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-cyan-glow/5 via-transparent to-transparent opacity-50"
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
                        From action-packed games to productivity software. Find exactly what you need.
                    </p>
                </motion.div>

                {/* Category Groups */}
                <div className="space-y-10">
                    {CATEGORY_GROUPS.map((group, index) => (
                        <CategoryGroupSection
                            key={group.id}
                            group={group}
                            index={index}
                        />
                    ))}
                </div>

                {/* View All Link */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-center mt-12"
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

export default CategoryBrowser;

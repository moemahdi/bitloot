'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AdminCatalogProductsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { 
    Loader2, RefreshCw, Crown, DollarSign, ArrowRight,
    Gamepad2, Monitor, Gift, Clock, Package, Eye, EyeOff, TrendingUp,
    Sparkles, AlertCircle, Plus
} from 'lucide-react';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';

// Business category definitions with icons and enhanced styling
const CATEGORY_CONFIG = {
    games: { 
        label: 'Games', 
        icon: Gamepad2, 
        color: 'text-cyan-glow', 
        bgColor: 'bg-cyan-glow/10', 
        borderColor: 'border-cyan-glow/30',
        hoverBorder: 'hover:border-cyan-glow',
        glowClass: 'hover:shadow-glow-cyan-sm',
        gradientFrom: 'from-cyan-glow/20',
        gradientTo: 'to-transparent'
    },
    software: { 
        label: 'Software', 
        icon: Monitor, 
        color: 'text-purple-neon', 
        bgColor: 'bg-purple-neon/10', 
        borderColor: 'border-purple-neon/30',
        hoverBorder: 'hover:border-purple-neon',
        glowClass: 'hover:shadow-glow-purple-sm',
        gradientFrom: 'from-purple-neon/20',
        gradientTo: 'to-transparent'
    },
    subscriptions: { 
        label: 'Subscriptions', 
        icon: Clock, 
        color: 'text-green-success', 
        bgColor: 'bg-green-success/10', 
        borderColor: 'border-green-success/30',
        hoverBorder: 'hover:border-green-success',
        glowClass: 'hover:shadow-glow-success',
        gradientFrom: 'from-green-success/20',
        gradientTo: 'to-transparent'
    },
} as const;

const productsApi = new AdminCatalogProductsApi(apiConfig);

// Cache time constants
const STATS_STALE_TIME = 120_000; // 2 minutes
const STATS_GC_TIME = 300_000; // 5 minutes

type BusinessCategory = 'games' | 'software' | 'subscriptions';

interface CategoryStats {
    category: BusinessCategory;
    total: number;
    published: number;
    featured: number;
}

// Skeleton Card Component
function StatCardSkeleton(): React.ReactElement {
    return (
        <Card className="border-border-subtle">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
                <div className="skeleton h-8 w-20 rounded mb-2" />
                <div className="skeleton h-3 w-32 rounded" />
            </CardContent>
        </Card>
    );
}

// Category Card Skeleton
function CategoryCardSkeleton(): React.ReactElement {
    return (
        <Card className="border-border-subtle">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="skeleton h-4 w-20 rounded" />
                <div className="skeleton h-5 w-5 rounded" />
            </CardHeader>
            <CardContent>
                <div className="skeleton h-8 w-16 rounded mb-3" />
                <div className="flex gap-4">
                    <div className="skeleton h-3 w-16 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                </div>
            </CardContent>
        </Card>
    );
}

// Quick Action Card Component
interface QuickActionProps {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    accentColor?: 'cyan' | 'purple' | 'pink' | 'green';
}

function QuickAction({ href, icon: Icon, label, description, accentColor = 'cyan' }: QuickActionProps): React.ReactElement {
    const colorClasses = {
        cyan: 'group-hover:text-cyan-glow group-hover:bg-cyan-glow/10 hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm',
        purple: 'group-hover:text-purple-neon group-hover:bg-purple-neon/10 hover:border-purple-neon/50 hover:shadow-glow-purple-sm',
        pink: 'group-hover:text-pink-featured group-hover:bg-pink-featured/10 hover:border-pink-featured/50 hover:shadow-glow-pink',
        green: 'group-hover:text-green-success group-hover:bg-green-success/10 hover:border-green-success/50 hover:shadow-glow-success',
    };
    
    const textColor = {
        cyan: 'group-hover:text-cyan-glow',
        purple: 'group-hover:text-purple-neon',
        pink: 'group-hover:text-pink-featured',
        green: 'group-hover:text-green-success',
    };

    return (
        <Link href={href} className="block">
            <Card className={`h-full border-border-subtle ${colorClasses[accentColor]} transition-all duration-250 cursor-pointer group`}>
                <CardContent className="flex items-center gap-4 p-4">
                    <div className={`p-3 rounded-lg bg-bg-tertiary ${colorClasses[accentColor].split(' ').slice(1, 2).join(' ')} transition-colors duration-250`}>
                        <Icon className={`h-6 w-6 text-text-muted ${textColor[accentColor]} transition-colors duration-250`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className={`font-medium text-text-primary ${textColor[accentColor]} transition-colors duration-250`}>{label}</div>
                        <div className="text-sm text-text-muted truncate">{description}</div>
                    </div>
                    <ArrowRight className={`h-4 w-4 text-text-muted ${textColor[accentColor]} group-hover:translate-x-1 transition-all duration-250 flex-shrink-0`} />
                </CardContent>
            </Card>
        </Link>
    );
}

export default function AdminCatalogPage(): React.ReactElement | null {
    const { isLoading, isAdmin } = useAdminGuard();

    // Category Stats Query - for dashboard
    const { data: categoryStats, isLoading: isStatsLoading, error: statsError } = useQuery<CategoryStats[]>({
        queryKey: ['admin-category-stats'],
        queryFn: async () => {
            // Fetch counts for each category
            const categories: BusinessCategory[] = ['games', 'software', 'subscriptions'];
            const stats = await Promise.all(
                categories.map(async (cat) => {
                    const total = await productsApi.adminProductsControllerListAll({
                        businessCategory: cat,
                        page: '1',
                        limit: '1',
                    });
                    const published = await productsApi.adminProductsControllerListAll({
                        businessCategory: cat,
                        published: 'true',
                        page: '1',
                        limit: '1',
                    });
                    const featured = await productsApi.adminProductsControllerListAll({
                        businessCategory: cat,
                        featured: 'true',
                        page: '1',
                        limit: '1',
                    });
                    return {
                        category: cat,
                        total: total.total ?? 0,
                        published: published.total ?? 0,
                        featured: featured.total ?? 0,
                    };
                })
            );
            return stats;
        },
        enabled: isAdmin,
        staleTime: STATS_STALE_TIME,
        gcTime: STATS_GC_TIME,
    });

    // Calculate totals from stats
    const totalAllProducts = categoryStats?.reduce((acc, s) => acc + s.total, 0) ?? 0;
    const totalPublished = categoryStats?.reduce((acc, s) => acc + s.published, 0) ?? 0;
    const totalFeatured = categoryStats?.reduce((acc, s) => acc + s.featured, 0) ?? 0;
    const hasProducts = totalAllProducts > 0;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-bg-primary">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin-glow text-cyan-glow" />
                    <p className="text-text-secondary animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header with gradient accent */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-glow/5 via-purple-neon/5 to-transparent rounded-2xl blur-xl" />
                <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-1">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-glow/10 border border-cyan-glow/20">
                                <Sparkles className="h-6 w-6 text-cyan-glow" />
                            </div>
                            <h1 className="text-3xl font-bold text-text-primary">Catalog Dashboard</h1>
                        </div>
                        <p className="text-text-secondary mt-2 ml-14">Overview of your product catalog and quick access to management tools.</p>
                    </div>
                    {hasProducts && (
                        <Link href="/admin/catalog/products">
                            <Button className="btn-primary gap-2 shadow-glow-cyan-sm hover:shadow-glow-cyan transition-all duration-250">
                                <Package className="h-4 w-4" />
                                Manage Products
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Error State */}
            {statsError != null && (
                <Card className="border-orange-warning/50 bg-orange-warning/5">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="p-3 rounded-lg bg-orange-warning/10">
                            <AlertCircle className="h-6 w-6 text-orange-warning" />
                        </div>
                        <div className="flex-1">
                            <div className="font-medium text-orange-warning">Failed to load statistics</div>
                            <div className="text-sm text-text-muted">Please try refreshing the page.</div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Dashboard Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isStatsLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        {/* Total Products */}
                        <Card className="border-border-subtle hover:border-border-accent hover:shadow-card-md transition-all duration-250 group">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-text-secondary">Total Products</CardTitle>
                                <div className="p-1.5 rounded-md bg-bg-tertiary group-hover:bg-cyan-glow/10 transition-colors duration-250">
                                    <Package className="h-4 w-4 text-text-muted group-hover:text-cyan-glow transition-colors duration-250" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-text-primary">{totalAllProducts.toLocaleString()}</div>
                                <p className="text-xs text-text-muted mt-1">Across all categories</p>
                            </CardContent>
                        </Card>

                        {/* Published */}
                        <Card className="border-border-subtle hover:border-green-success/50 hover:shadow-glow-success transition-all duration-250 group">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-text-secondary">Published</CardTitle>
                                <div className="p-1.5 rounded-md bg-green-success/10 group-hover:bg-green-success/20 transition-colors duration-250">
                                    <Eye className="h-4 w-4 text-green-success" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-success">{totalPublished.toLocaleString()}</div>
                                <p className="text-xs text-text-muted mt-1">
                                    {totalAllProducts > 0 ? `${Math.round((totalPublished / totalAllProducts) * 100)}% of catalog` : '0%'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Draft */}
                        <Card className="border-border-subtle hover:border-border-accent hover:shadow-card-md transition-all duration-250 group">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-text-secondary">Draft</CardTitle>
                                <div className="p-1.5 rounded-md bg-bg-tertiary group-hover:bg-purple-neon/10 transition-colors duration-250">
                                    <EyeOff className="h-4 w-4 text-text-muted group-hover:text-purple-neon transition-colors duration-250" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-text-secondary">{(totalAllProducts - totalPublished).toLocaleString()}</div>
                                <p className="text-xs text-text-muted mt-1">Awaiting publish</p>
                            </CardContent>
                        </Card>

                        {/* Featured */}
                        <Card className="border-border-subtle hover:border-cyan-glow/50 hover:shadow-glow-cyan-sm transition-all duration-250 group">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-text-secondary">Featured</CardTitle>
                                <div className="p-1.5 rounded-md bg-cyan-glow/10 group-hover:bg-cyan-glow/20 transition-colors duration-250">
                                    <TrendingUp className="h-4 w-4 text-cyan-glow" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-cyan-glow">{totalFeatured.toLocaleString()}</div>
                                <p className="text-xs text-text-muted mt-1">Highlighted on store</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Empty State - No Products */}
            {!isStatsLoading && !hasProducts && (
                <Card className="border-border-subtle border-dashed">
                    <CardContent className="py-16">
                        <div className="empty-state">
                            <div className="p-4 rounded-full bg-cyan-glow/10 mb-4">
                                <Package className="empty-state-icon text-cyan-glow" />
                            </div>
                            <h3 className="empty-state-title text-text-primary">No products yet</h3>
                            <p className="empty-state-description text-text-secondary">
                                Get started by importing products from Kinguin or creating your first custom product.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <Link href="/admin/catalog/import">
                                    <Button className="btn-primary gap-2 shadow-glow-cyan-sm hover:shadow-glow-cyan">
                                        <Crown className="h-4 w-4" />
                                        Import from Kinguin
                                    </Button>
                                </Link>
                                <Link href="/admin/catalog/products/new">
                                    <Button variant="outline" className="gap-2 hover:border-purple-neon hover:text-purple-neon">
                                        <Plus className="h-4 w-4" />
                                        Create Custom Product
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Category Breakdown Cards */}
            {(isStatsLoading || hasProducts) && (
                <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 bg-gradient-to-b from-cyan-glow to-purple-neon rounded-full" />
                        Categories
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {isStatsLoading ? (
                            <>
                                <CategoryCardSkeleton />
                                <CategoryCardSkeleton />
                                <CategoryCardSkeleton />
                                <CategoryCardSkeleton />
                            </>
                        ) : (
                            categoryStats?.map((stat) => {
                                const config = CATEGORY_CONFIG[stat.category];
                                const Icon = config.icon;
                                return (
                                    <Link key={stat.category} href={`/admin/catalog/products?category=${stat.category}`}>
                                        <Card 
                                            className={`relative overflow-hidden ${config.bgColor} ${config.borderColor} border cursor-pointer transition-all duration-250 ${config.hoverBorder} ${config.glowClass} hover:scale-[1.02] group`}
                                        >
                                            {/* Gradient overlay on hover */}
                                            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} opacity-0 group-hover:opacity-100 transition-opacity duration-250`} />
                                            
                                            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                                                <CardTitle className={`text-sm font-medium ${config.color}`}>{config.label}</CardTitle>
                                                <div className={`p-1.5 rounded-md ${config.bgColor} group-hover:scale-110 transition-transform duration-250`}>
                                                    <Icon className={`h-5 w-5 ${config.color}`} />
                                                </div>
                                            </CardHeader>
                                            <CardContent className="relative">
                                                <div className={`text-2xl font-bold ${config.color}`}>{stat.total.toLocaleString()}</div>
                                                <div className="flex gap-4 mt-2 text-xs text-text-muted">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" /> {stat.published} live
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <TrendingUp className="h-3 w-3" /> {stat.featured} featured
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-gradient-to-b from-purple-neon to-pink-featured rounded-full" />
                    Quick Actions
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <QuickAction 
                        href="/admin/catalog/products" 
                        icon={Package} 
                        label="Manage Products" 
                        description="View, edit, and organize all products"
                        accentColor="cyan"
                    />
                    <QuickAction 
                        href="/admin/catalog/import" 
                        icon={Crown} 
                        label="Import from Kinguin" 
                        description="Add new products from Kinguin catalog"
                        accentColor="purple"
                    />
                    <QuickAction 
                        href="/admin/catalog/sync" 
                        icon={RefreshCw} 
                        label="Sync Prices" 
                        description="Update prices from Kinguin"
                        accentColor="green"
                    />
                    <QuickAction 
                        href="/admin/catalog/rules" 
                        icon={DollarSign} 
                        label="Pricing Rules" 
                        description="Manage markup and pricing rules"
                        accentColor="pink"
                    />
                </div>
            </div>
        </div>
    );
}

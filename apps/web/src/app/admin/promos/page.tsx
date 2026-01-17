'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tag, Plus, TrendingUp, CheckCircle, Users, Percent, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/primitives/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/design-system/primitives/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives/tabs';
import { Button } from '@/design-system/primitives/button';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { PromoCodesList } from '@/features/admin/components/promo-codes-list';
import { PromoCodeForm } from '@/features/admin/components/promo-code-form';
import { PromoRedemptionsView } from '@/features/admin/components/promo-redemptions-view';
import { AdminPromosApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';

const adminPromosClient = new AdminPromosApi(apiConfig);

interface PromoCode {
    id: string;
    code: string;
    description?: string;
    discountType: 'percent' | 'fixed';
    discountValue: string;
    minOrderValue?: string;
    maxUsesTotal?: number;
    maxUsesPerUser?: number;
    usageCount: number;
    scopeType: 'global' | 'category' | 'product';
    scopeValue?: string;
    startsAt?: string;
    expiresAt?: string;
    stackable: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

type View = 'list' | 'redemptions';

interface StatsCardProps {
    title: string;
    value: string | number;
    description: string;
    icon: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

function StatsCard({ title, value, description, icon, trend }: StatsCardProps): React.ReactElement {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    {description}
                </p>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`h-3 w-3 ${trend.isPositive ? '' : 'rotate-180'}`} />
                        <span>{Math.abs(trend.value)}% from last month</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function StatsCardSkeleton(): React.ReactElement {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
            </CardContent>
        </Card>
    );
}

export default function AdminPromosPage(): React.ReactElement {
    const [activeTab, setActiveTab] = useState<View>('list');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<PromoCode | undefined>(undefined);
    const [viewingRedemptions, setViewingRedemptions] = useState<{ id: string; code: string } | null>(null);

    // Fetch stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['promo-stats'],
        queryFn: async () => {
            const data = await adminPromosClient.adminPromosControllerList({ page: 1, limit: 1000 });
            const activeCodes = data.data.filter(p => p.isActive).length;
            const totalRedemptions = data.data.reduce((sum, p) => sum + (p.usageCount ?? 0), 0);
            const avgDiscount = data.data.length > 0
                ? data.data.reduce((sum, p) => {
                    const val = parseFloat(p.discountValue);
                    return sum + (p.discountType === 'percent' ? val : 0);
                }, 0) / data.data.filter(p => p.discountType === 'percent').length
                : 0;

            return {
                totalCodes: data.total,
                activeCodes,
                totalRedemptions,
                avgDiscountPercent: avgDiscount.toFixed(1),
            };
        },
        staleTime: 30000,
    });

    const handleCreate = (): void => {
        setEditingPromo(undefined);
        setDialogOpen(true);
    };

    const handleEdit = (promo: PromoCode): void => {
        setEditingPromo(promo);
        setDialogOpen(true);
    };

    const handleViewRedemptions = (promoId: string, code: string): void => {
        setViewingRedemptions({ id: promoId, code });
        setActiveTab('redemptions');
    };

    const handleFormSuccess = (): void => {
        setDialogOpen(false);
        setEditingPromo(undefined);
    };

    const handleBackToList = (): void => {
        setActiveTab('list');
        setViewingRedemptions(null);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                        <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Promo Codes</h1>
                        <p className="text-muted-foreground text-sm">
                            Create and manage discount codes for your store
                        </p>
                    </div>
                </div>
                <Button onClick={handleCreate} size="default" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Promo Code
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsLoading ? (
                    <>
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatsCard
                            title="Total Codes"
                            value={stats?.totalCodes ?? 0}
                            description="All promo codes created"
                            icon={<Tag className="h-4 w-4 text-muted-foreground" />}
                        />
                        <StatsCard
                            title="Active Codes"
                            value={stats?.activeCodes ?? 0}
                            description="Currently available codes"
                            icon={<CheckCircle className="h-4 w-4 text-green-600" />}
                        />
                        <StatsCard
                            title="Total Redemptions"
                            value={stats?.totalRedemptions ?? 0}
                            description="Successful code uses"
                            icon={<Users className="h-4 w-4 text-blue-600" />}
                        />
                        <StatsCard
                            title="Avg Discount"
                            value={`${stats?.avgDiscountPercent ?? 0}%`}
                            description="Average percent discount"
                            icon={<Percent className="h-4 w-4 text-purple-600" />}
                        />
                    </>
                )}
            </div>

            {/* Main Content with Tabs */}
            <Card>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as View)} className="w-full">
                    <CardHeader className="border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>
                                    {activeTab === 'list' ? 'All Promo Codes' : `Redemptions for ${viewingRedemptions?.code}`}
                                </CardTitle>
                                <CardDescription className="mt-1.5">
                                    {activeTab === 'list'
                                        ? 'Manage discount codes with usage limits, date constraints, and scoping'
                                        : 'View all redemptions for this promo code'
                                    }
                                </CardDescription>
                            </div>
                            {activeTab === 'redemptions' && (
                                <Button variant="outline" size="sm" onClick={handleBackToList}>
                                    Back to List
                                </Button>
                            )}
                        </div>
                        {activeTab === 'list' && (
                            <TabsList className="mt-4">
                                <TabsTrigger value="list">All Codes</TabsTrigger>
                                <TabsTrigger value="redemptions" disabled={viewingRedemptions === null}>
                                    Redemptions
                                </TabsTrigger>
                            </TabsList>
                        )}
                    </CardHeader>
                    <CardContent className="pt-6">
                        <TabsContent value="list" className="mt-0">
                            <PromoCodesList
                                onEdit={handleEdit}
                                onCreate={handleCreate}
                                onViewRedemptions={handleViewRedemptions}
                            />
                        </TabsContent>
                        <TabsContent value="redemptions" className="mt-0">
                            {viewingRedemptions !== null && (
                                <PromoRedemptionsView
                                    promoId={viewingRedemptions.id}
                                    promoCode={viewingRedemptions.code}
                                    onBack={handleBackToList}
                                />
                            )}
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingPromo !== undefined ? (
                                <>
                                    <Pencil className="h-5 w-5 text-muted-foreground" />
                                    Edit Promo Code
                                </>
                            ) : (
                                <>
                                    <Plus className="h-5 w-5 text-muted-foreground" />
                                    Create Promo Code
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {editingPromo !== undefined
                                ? `Editing ${editingPromo.code} — Update discount settings and availability`
                                : 'Create a new discount code with custom rules and restrictions'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <PromoCodeForm
                        initialData={editingPromo}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

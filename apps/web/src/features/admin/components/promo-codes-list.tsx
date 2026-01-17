'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye, MoreHorizontal, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/design-system/primitives/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/design-system/primitives/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/design-system/primitives/alert-dialog';
import { Badge } from '@/design-system/primitives/badge';
import { toast } from 'sonner';
import { apiConfig } from '@/lib/api-config';
import { AdminPromosApi } from '@bitloot/sdk';
import type { PromoCodeResponseDto, PaginatedPromoCodesDto } from '@bitloot/sdk';

const adminPromosClient = new AdminPromosApi(apiConfig);

interface PromoCodesListProps {
    onEdit: (promo: PromoCodeResponseDto) => void;
    onCreate: () => void;
    onViewRedemptions: (promoId: string, code: string) => void;
}

async function fetchPromoCodes(page: number, limit: number, search: string): Promise<PaginatedPromoCodesDto> {
    return adminPromosClient.adminPromosControllerList({
        page,
        limit,
        search: search || undefined,
    });
}

async function deletePromoCode(id: string): Promise<void> {
    await adminPromosClient.adminPromosControllerDelete({ id });
}

export function PromoCodesList({ onEdit, onCreate, onViewRedemptions }: PromoCodesListProps): React.ReactElement {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [promoToDelete, setPromoToDelete] = useState<{ id: string; code: string } | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-promos', page, search],
        queryFn: () => fetchPromoCodes(page, 20, search),
    });

    const deleteMutation = useMutation({
        mutationFn: deletePromoCode,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
            toast.success('Promo code deleted successfully');
            setDeleteDialogOpen(false);
            setPromoToDelete(null);
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Failed to delete promo code');
        },
    });

    const handleDeleteClick = (id: string, code: string): void => {
        setPromoToDelete({ id, code });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = (): void => {
        if (promoToDelete !== null) {
            deleteMutation.mutate(promoToDelete.id);
        }
    };

    const formatDiscount = (promo: PromoCodeResponseDto): string => {
        if (promo.discountType === 'percent') {
            return `${promo.discountValue}%`;
        }
        return `€${parseFloat(promo.discountValue).toFixed(2)}`;
    };

    const getStatusBadge = (promo: PromoCodeResponseDto): React.ReactElement => {
        const now = new Date();
        const startsAt = promo.startsAt !== undefined ? new Date(promo.startsAt) : null;
        const expiresAt = promo.expiresAt !== undefined ? new Date(promo.expiresAt) : null;

        if (!promo.isActive) {
            return <Badge variant="secondary">Inactive</Badge>;
        }
        if (startsAt !== null && startsAt > now) {
            return <Badge variant="outline">Scheduled</Badge>;
        }
        if (expiresAt !== null && expiresAt < now) {
            return <Badge variant="destructive">Expired</Badge>;
        }
        if (promo.maxUsesTotal !== undefined && promo.usageCount >= promo.maxUsesTotal) {
            return <Badge variant="secondary">Exhausted</Badge>;
        }
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Active</Badge>;
    };

    if (error !== null && error !== undefined) {
        return (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                Failed to load promo codes: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Input
                        placeholder="Search codes..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-64"
                    />
                </div>
                <Button onClick={onCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Promo Code
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Scope</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : data?.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No promo codes found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data.map((promo) => (
                                <TableRow key={promo.id}>
                                    <TableCell>
                                        <div>
                                            <span className="font-mono font-semibold">{promo.code}</span>
                                            {promo.description !== undefined && promo.description.length > 0 && (
                                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                    {promo.description}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-semibold">{formatDiscount(promo)}</span>
                                        <span className="text-muted-foreground ml-1">
                                            {promo.discountType === 'percent' ? 'off' : ''}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {promo.scopeType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-medium">{promo.usageCount}</span>
                                        {promo.maxUsesTotal !== undefined && (
                                            <span className="text-muted-foreground">/{promo.maxUsesTotal}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(promo)}</TableCell>
                                    <TableCell>
                                        {promo.expiresAt !== undefined ? (
                                            new Date(promo.expiresAt).toLocaleDateString()
                                        ) : (
                                            <span className="text-muted-foreground">Never</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(promo)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onViewRedemptions(promo.id, promo.code)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Redemptions
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteClick(promo.id, promo.code)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {data !== undefined && data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {data.data.length} of {data.total} promo codes
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-3 text-sm">
                            Page {page} of {data.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                            disabled={page === data.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="pt-3">
                            Are you sure you want to delete the promo code{' '}
                            <span className="font-mono font-semibold text-foreground">
                                {promoToDelete?.code}
                            </span>
                            ? This action cannot be undone and will permanently remove the code and all its redemption history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

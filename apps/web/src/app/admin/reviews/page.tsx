'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/design-system/primitives/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/primitives/dialog';
import { Textarea } from '@/design-system/primitives/textarea';
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  Home,
  Eye,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { useAdminGuard } from '@/features/admin/hooks/useAdminGuard';
import { formatDate } from '@/utils/format-date';
import { useAdminTableState } from '@/features/admin/hooks/useAdminTableState';
import {
  useAdminReviews,
  useAdminReviewStats,
  useModerateReview,
  useToggleHomepageDisplay,
  useDeleteReview,
  useBulkApproveReviews,
  useBulkRejectReviews,
  useAdminCreateReview,
} from '@/features/admin/hooks/useAdminReviews';
import type { AdminReviewResponseDto } from '@bitloot/sdk';
import { AdminCatalogProductsApi } from '@bitloot/sdk';
import { apiConfig } from '@/lib/api-config';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/design-system/primitives/label';

function StarRating({ rating }: { rating: number }): React.ReactElement {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'approved':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export default function AdminReviewsPage(): React.ReactElement {
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  const [selectedReview, setSelectedReview] = useState<AdminReviewResponseDto | null>(null);
  const [moderateDialogOpen, setModerateDialogOpen] = useState(false);
  const [moderateAction, setModerateAction] = useState<'approved' | 'rejected'>('approved');
  const [moderateReason, setModerateReason] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Create review dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createRating, setCreateRating] = useState(5);
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createAuthorName, setCreateAuthorName] = useState('');
  const [createStatus, setCreateStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');
  const [createDisplayOnHomepage, setCreateDisplayOnHomepage] = useState(false);
  const [createAdminNotes, setCreateAdminNotes] = useState('');
  const [createProductId, setCreateProductId] = useState<string>('');

  const tableState = useAdminTableState({
    initialFilters: {
      status: 'all',
      search: '',
    },
  });

  const { page, limit, filters, setPage, setLimit, handleFilterChange } = tableState;

  const { reviews, total: totalItems, isLoading, refetch } = useAdminReviews(tableState);
  const { data: stats, isLoading: statsLoading } = useAdminReviewStats();
  const totalPages = totalItems > 0 && limit > 0 ? Math.ceil(totalItems / limit) : 0;

  // Fetch products for the dropdown
  const productsQuery = useQuery({
    queryKey: ['admin', 'catalog', 'products', 'for-review'],
    queryFn: async () => {
      const api = new AdminCatalogProductsApi(apiConfig);
      return await api.adminProductsControllerListAll({ page: '1', limit: '100' });
    },
    enabled: createDialogOpen,
    staleTime: 30_000,
  });

  const moderateReview = useModerateReview();
  const toggleHomepage = useToggleHomepageDisplay();
  const deleteReview = useDeleteReview();
  const bulkApprove = useBulkApproveReviews();
  const bulkReject = useBulkRejectReviews();
  const createReview = useAdminCreateReview();

  const resetCreateForm = (): void => {
    setCreateRating(5);
    setCreateTitle('');
    setCreateContent('');
    setCreateAuthorName('');
    setCreateStatus('approved');
    setCreateDisplayOnHomepage(false);
    setCreateAdminNotes('');
    setCreateProductId('');
  };

  const handleCreateReview = async (): Promise<void> => {
    await createReview.mutateAsync({
      rating: createRating,
      title: createTitle.length > 0 ? createTitle : undefined,
      content: createContent,
      authorName: createAuthorName,
      status: createStatus,
      displayOnHomepage: createDisplayOnHomepage,
      adminNotes: createAdminNotes.length > 0 ? createAdminNotes : undefined,
      productId: createProductId.length > 0 && createProductId !== 'none' ? createProductId : undefined,
    });
    setCreateDialogOpen(false);
    resetCreateForm();
  };

  const handleModerate = (review: AdminReviewResponseDto, action: 'approved' | 'rejected'): void => {
    setSelectedReview(review);
    setModerateAction(action);
    setModerateReason('');
    setModerateDialogOpen(true);
  };

  const confirmModerate = async (): Promise<void> => {
    if (selectedReview == null) return;
    await moderateReview.mutateAsync({
      id: selectedReview.id,
      status: moderateAction,
      adminNotes: moderateReason.length > 0 ? moderateReason : undefined,
    });
    setModerateDialogOpen(false);
    setSelectedReview(null);
  };

  const handleDelete = (review: AdminReviewResponseDto): void => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (selectedReview == null) return;
    await deleteReview.mutateAsync(selectedReview.id);
    setDeleteDialogOpen(false);
    setSelectedReview(null);
  };

  const handleToggleHomepage = async (review: AdminReviewResponseDto): Promise<void> => {
    await toggleHomepage.mutateAsync(review.id);
  };

  const handleViewReview = (review: AdminReviewResponseDto): void => {
    setSelectedReview(review);
    setViewDialogOpen(true);
  };

  if (guardLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <div />;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Management</h1>
          <p className="text-muted-foreground">Moderate customer reviews and manage homepage display.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="default"
            onClick={() => bulkApprove.mutate()}
            disabled={bulkApprove.isPending}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve All Pending
          </Button>
          <Button
            variant="destructive"
            onClick={() => bulkReject.mutate()}
            disabled={bulkReject.isPending}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject All Pending
          </Button>
          <Button
            variant="secondary"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Review
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalReviews ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                (stats?.averageRating ?? 0).toFixed(1)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge variant="secondary">{(stats?.statusBreakdown as Record<string, number> | undefined)?.pending ?? 0}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (stats?.statusBreakdown as Record<string, number> | undefined)?.pending ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Badge variant="default">{(stats?.statusBreakdown as Record<string, number> | undefined)?.approved ?? 0}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (stats?.statusBreakdown as Record<string, number> | undefined)?.approved ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Reviews</CardTitle>
              <CardDescription>Total reviews: {totalItems}</CardDescription>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  className="pl-9 w-full md:w-[250px]"
                  value={(filters.search as string) ?? ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <Select
                value={(filters.status as string) ?? 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No reviews found</p>
              <p className="text-sm">Adjust your filters or wait for customer reviews.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Homepage</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{review.authorName}</span>
                          {review.isVerifiedPurchase && (
                            <Badge variant="outline" className="w-fit text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {review.orderId != null ? (
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                            {review.orderId.slice(0, 8)}...
                          </code>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {review.orderItems !== null && review.orderItems !== undefined && review.orderItems.length > 0 ? (
                          <div className="space-y-0.5">
                            {(() => {
                              // Aggregate items with the same productId
                              const aggregatedItems = review.orderItems.reduce((acc, item) => {
                                const existing = acc.find(i => i.productId === item.productId);
                                if (existing !== undefined) {
                                  existing.quantity += item.quantity;
                                } else {
                                  acc.push({ ...item });
                                }
                                return acc;
                              }, [] as typeof review.orderItems);
                              
                              return aggregatedItems.map((item) => (
                                <div key={item.productId} className="text-sm truncate" title={item.productTitle}>
                                  {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.productTitle}
                                </div>
                              ));
                            })()}
                          </div>
                        ) : (
                          <span className="truncate">{(review.productName as string | undefined) ?? 'N/A'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StarRating rating={review.rating} />
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{(review.title as string | undefined) ?? 'No title'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(review.status)}>{review.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={review.displayOnHomepage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleHomepage(review)}
                          disabled={toggleHomepage.isPending}
                        >
                          <Home className={`h-4 w-4 ${review.displayOnHomepage ? '' : 'text-muted-foreground'}`} />
                        </Button>
                      </TableCell>
                      <TableCell>{formatDate(review.createdAt, 'date')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewReview(review)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {review.status !== 'approved' && (
                              <DropdownMenuItem onClick={() => handleModerate(review, 'approved')}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {review.status !== 'rejected' && (
                              <DropdownMenuItem onClick={() => handleModerate(review, 'rejected')}>
                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                Reject
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(review)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Moderate Dialog */}
      <Dialog open={moderateDialogOpen} onOpenChange={setModerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderateAction === 'approved' ? 'Approve Review' : 'Reject Review'}
            </DialogTitle>
            <DialogDescription>
              {moderateAction === 'approved'
                ? 'This review will be visible to customers.'
                : 'This review will be hidden from customers.'}
            </DialogDescription>
          </DialogHeader>
          {selectedReview != null && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{selectedReview.authorName}</span>
                  <StarRating rating={selectedReview.rating} />
                </div>
                <p className="text-sm font-medium">{String(selectedReview.title ?? '')}</p>
                <p className="text-sm text-muted-foreground line-clamp-3">{selectedReview.content}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Reason (optional)
                </label>
                <Textarea
                  placeholder="Add a note for internal reference..."
                  value={moderateReason}
                  onChange={(e) => setModerateReason(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={moderateAction === 'approved' ? 'default' : 'destructive'}
              onClick={confirmModerate}
              disabled={moderateReview.isPending}
            >
              {moderateReview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {moderateAction === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedReview != null && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{selectedReview.authorName}</span>
                <StarRating rating={selectedReview.rating} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{selectedReview.content}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteReview.isPending}
            >
              {deleteReview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview != null && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer</label>
                  <p className="font-medium">{selectedReview.authorName}</p>
                  {selectedReview.userEmail != null && (
                    <p className="text-sm text-muted-foreground">{String(selectedReview.userEmail)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Order ID</label>
                  {selectedReview.orderId != null ? (
                    <p className="font-mono text-sm bg-muted px-2 py-1 rounded w-fit">
                      {String(selectedReview.orderId)}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">No linked order</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product(s)</label>
                  {selectedReview.orderItems !== null && selectedReview.orderItems !== undefined && selectedReview.orderItems.length > 0 ? (
                    <div className="space-y-1 mt-1">
                      {(() => {
                        // Aggregate items with the same productId
                        const aggregatedItems = selectedReview.orderItems.reduce((acc, item) => {
                          const existing = acc.find(i => i.productId === item.productId);
                          if (existing !== undefined) {
                            existing.quantity += item.quantity;
                          } else {
                            acc.push({ ...item });
                          }
                          return acc;
                        }, [] as typeof selectedReview.orderItems);
                        
                        return aggregatedItems.map((item) => (
                          <p key={item.productId} className="font-medium">
                            {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.productTitle}
                          </p>
                        ));
                      })()}
                    </div>
                  ) : (
                    <p className="font-medium">{selectedReview.productName != null ? String(selectedReview.productName) : 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rating</label>
                  <StarRating rating={selectedReview.rating} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedReview.status)}>
                      {selectedReview.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Verified Purchase</label>
                  <p>{selectedReview.isVerifiedPurchase ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Display on Homepage</label>
                  <p>{selectedReview.displayOnHomepage ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p>{formatDate(selectedReview.createdAt, 'datetime')}</p>
                </div>
                {selectedReview.approvedAt != null && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Moderated</label>
                    <p>{formatDate(String(selectedReview.approvedAt), 'datetime')}</p>
                    {selectedReview.approvedByEmail != null && (
                      <p className="text-sm text-muted-foreground">by {String(selectedReview.approvedByEmail)}</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <p className="font-medium">{selectedReview.title != null ? String(selectedReview.title) : 'No title'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Content</label>
                <p className="text-sm whitespace-pre-wrap">{selectedReview.content}</p>
              </div>
              {selectedReview.adminNotes != null && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Admin Notes</label>
                  <p className="text-sm bg-muted p-2 rounded">{String(selectedReview.adminNotes)}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Review Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Review</DialogTitle>
            <DialogDescription>
              Add a new customer review. Reviews created by admins are typically marked as non-verified purchases.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product (Optional)</Label>
              <Select value={createProductId} onValueChange={setCreateProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No product (general review)</SelectItem>
                  {productsQuery.data?.products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {productsQuery.isLoading && (
                <p className="text-xs text-muted-foreground mt-1">Loading products...</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Author Name *</label>
              <Input
                value={createAuthorName}
                onChange={(e) => setCreateAuthorName(e.target.value)}
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Rating *</label>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCreateRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= createRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm text-muted-foreground ml-2">{createRating}/5</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="Review title (optional)"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content *</label>
              <Textarea
                value={createContent}
                onChange={(e) => setCreateContent(e.target.value)}
                placeholder="Write the review content..."
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={createStatus}
                onValueChange={(value: 'pending' | 'approved' | 'rejected') => setCreateStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="displayOnHomepage"
                checked={createDisplayOnHomepage}
                onChange={(e) => setCreateDisplayOnHomepage(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="displayOnHomepage" className="text-sm font-medium">
                Display on Homepage
              </label>
            </div>
            <div>
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                value={createAdminNotes}
                onChange={(e) => setCreateAdminNotes(e.target.value)}
                placeholder="Internal notes (optional)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateReview}
              disabled={
                createReview.isPending ||
                createAuthorName.length === 0 ||
                createContent.length === 0
              }
            >
              {createReview.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Review'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

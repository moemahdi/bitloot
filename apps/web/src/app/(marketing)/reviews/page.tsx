'use client';

import { useState, useMemo } from 'react';
import { Star, TrendingUp, MessageSquare, Award, Filter, Sparkles, ArrowUpDown, Search } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ReviewsApi, Configuration, type ReviewResponseDto } from '@bitloot/sdk';
import {
  Card,
  CardContent,
} from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Badge } from '@/design-system/primitives/badge';
import { Skeleton } from '@/design-system/primitives/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/primitives/select';
import { Separator } from '@/design-system/primitives/separator';
import { cn } from '@/design-system/utils/utils';

// Sort options type
type SortOption = 'recent' | 'highest' | 'lowest' | 'helpful';

// SDK Configuration
const config = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
});
const reviewsApi = new ReviewsApi(config);

// Star Rating Component with Neon Glow
function StarRating({ rating, size = 'default' }: { rating: number; size?: 'sm' | 'default' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            'transition-all duration-200',
            star <= rating
              ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
              : 'fill-transparent text-text-muted'
          )}
        />
      ))}
    </div>
  );
}

// Order Item Type for Reviews
interface ReviewOrderItem {
  productId: string;
  productTitle: string;
  productSlug?: string | null;
  quantity: number;
}

// Review Card Component
interface ReviewCardProps {
  id: string;
  rating: number;
  title?: string;
  content: string;
  authorName: string;
  isVerifiedPurchase: boolean;
  productName?: string;
  productSlug?: string;
  orderItems?: ReviewOrderItem[];
  createdAt: string;
}

function ReviewCard({
  rating,
  title,
  content,
  authorName,
  isVerifiedPurchase,
  productName,
  productSlug,
  orderItems,
  createdAt,
}: ReviewCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="h-full bg-bg-secondary border-border-subtle shadow-card-md hover:shadow-glow-cyan-sm hover:border-border-accent transition-all duration-250">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <StarRating rating={rating} />
                {title !== undefined && title !== null && title !== '' && (
                  <h3 className="font-semibold text-lg leading-tight text-text-primary">{title}</h3>
                )}
              </div>
              {isVerifiedPurchase && (
                <Badge className="badge-info gap-1 shrink-0">
                  <Award className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>

            {/* Content */}
            <p className="text-sm text-text-secondary leading-relaxed">
              {content}
            </p>

            {/* Order Items / Products */}
            {orderItems !== undefined && orderItems !== null && orderItems.length > 0 ? (
              <div className="pt-2 space-y-1.5">
                {(() => {
                  // Aggregate items with the same productId
                  const aggregatedItems = orderItems.reduce((acc, item) => {
                    const existing = acc.find(i => i.productId === item.productId);
                    if (existing !== undefined && existing !== null) {
                      existing.quantity += item.quantity;
                    } else {
                      acc.push({ ...item });
                    }
                    return acc;
                  }, [] as ReviewOrderItem[]);

                  return (
                    <>
                      <span className="text-xs text-text-muted font-medium">
                        {aggregatedItems.length === 1 ? 'Product:' : 'Products:'}
                      </span>
                      {aggregatedItems.map((item) => (
                        <div key={item.productId} className="flex items-center gap-1 text-sm">
                          {item.quantity > 1 && (
                            <span className="text-text-secondary">{item.quantity} items of </span>
                          )}
                          {item.productSlug !== undefined && item.productSlug !== null && item.productSlug !== '' ? (
                            <Link 
                              href={`/product/${item.productSlug}`}
                              className="text-cyan-glow hover:text-pink-featured transition-colors duration-200 inline-flex items-center gap-1 group"
                            >
                              <span className="group-hover:underline">{item.productTitle}</span>
                              <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          ) : (
                            <span className="text-text-secondary">{item.productTitle}</span>
                          )}
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            ) : productName !== undefined && productName !== null && productName !== '' && (
              <div className="pt-2">
                {productSlug !== undefined && productSlug !== null && productSlug !== '' ? (
                  <Link 
                    href={`/product/${productSlug}`}
                    className="text-sm text-cyan-glow hover:text-pink-featured transition-colors duration-200 inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:underline">Product: {productName}</span>
                    <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ) : (
                  <span className="text-sm text-text-secondary">Product: {productName}</span>
                )}
              </div>
            )}

            <Separator className="bg-border-subtle" />

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="font-medium text-text-primary">{authorName}</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Review Skeleton Component with Shimmer Animation
function ReviewSkeleton() {
  return (
    <Card className="bg-bg-secondary border-border-subtle">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-5 w-5 rounded-full skeleton animate-shimmer" />
              ))}
            </div>
            <Skeleton className="h-5 w-20 skeleton animate-shimmer" />
          </div>
          <Skeleton className="h-6 w-3/4 skeleton animate-shimmer" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full skeleton animate-shimmer" />
            <Skeleton className="h-4 w-full skeleton animate-shimmer" />
            <Skeleton className="h-4 w-2/3 skeleton animate-shimmer" />
          </div>
          <Separator className="bg-border-subtle" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24 skeleton animate-shimmer" />
            <Skeleton className="h-3 w-20 skeleton animate-shimmer" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Stats Card Component with Neon Glow
import type { LucideIcon } from 'lucide-react';

function StatsCard({ icon: Icon, label, value, trend }: { icon: LucideIcon; label: string; value: string; trend?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="animate-float"
    >
      <Card className="bg-bg-secondary border-border-subtle shadow-card-md hover:shadow-glow-cyan-sm hover:border-border-accent transition-all duration-250">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-cyan-glow/10 flex items-center justify-center shadow-glow-cyan-sm">
              <Icon className="h-6 w-6 text-cyan-glow" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-secondary">{label}</p>
              <p className="text-2xl font-bold text-text-primary">{value}</p>
              {trend !== undefined && trend !== '' && (
                <p className="text-xs text-green-success flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  {trend}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AllReviewsPage() {
  const [page, setPage] = useState(1);
  const [filterRating, setFilterRating] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const pageSize = 12;

  // Response type for reviews
  interface ReviewsResponse {
    data: ReviewResponseDto[];
    total: number;
    stats: {
      averageRating: string;
      totalReviews: number;
    };
  }

  // Fetch all reviews with proper pagination
  // TODO: Backend should expose GET /reviews endpoint with pagination support
  const { data: reviewsResponse, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['all-reviews', page, pageSize, filterRating, sortBy],
    queryFn: async (): Promise<ReviewsResponse> => {
      // Call the paginated reviews endpoint
      // Backend should return { data: Review[], total: number, stats: { averageRating, totalReviews } }
      const reviews = await reviewsApi.reviewsControllerGetHomepageReviews({ 
        limit: pageSize,
        // TODO: Add these params when backend supports them:
        // page,
        // rating: filterRating !== 'all' ? parseInt(filterRating, 10) : undefined,
        // sort: sortBy,
      });
      
      const reviewCount = reviews.length;
      const avgRating = reviewCount > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
        : '0.0';
      
      return {
        data: reviews,
        total: reviewCount, // TODO: Get from backend pagination response
        stats: {
          // TODO: Get from backend for accuracy across all pages
          averageRating: avgRating,
          totalReviews: reviewCount,
        }
      };
    },
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const reviewsData = useMemo(() => reviewsResponse?.data ?? [], [reviewsResponse?.data]);
  const stats = reviewsResponse?.stats ?? { averageRating: '0.0', totalReviews: 0 };
  const totalPages = Math.ceil((reviewsResponse?.total ?? 0) / pageSize);

  // Memoized filter and sort logic for performance
  const filteredAndSortedReviews = useMemo(() => {
    let result = [...reviewsData];
    
    // Filter by rating
    if (filterRating !== 'all') {
      const targetRating = parseInt(filterRating, 10);
      result = result.filter((review) => review.rating === targetRating);
    }
    
    // Sort reviews
    switch (sortBy) {
      case 'highest':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        result.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        // helpfulCount may not exist on ReviewResponseDto, default to 0
        result.sort((a, b) => {
          const aCount = (a as unknown as { helpfulCount?: number }).helpfulCount ?? 0;
          const bCount = (b as unknown as { helpfulCount?: number }).helpfulCount ?? 0;
          return bCount - aCount;
        });
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    
    return result;
  }, [reviewsData, filterRating, sortBy]);

  // Reset to page 1 when filters change
  const handleFilterChange = (value: string) => {
    setFilterRating(value);
    setPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section with Mesh Gradient */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-30" />
        <div className="absolute inset-0 bg-linear-to-b from-cyan-glow/10 via-purple-neon/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-primary mb-4 tracking-tight">
              Customer Reviews
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              Real reviews from verified BitLoot customers. Every review comes from someone who actually purchased and used the product.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 border-y border-border-subtle bg-linear-to-r from-bg-secondary/50 via-bg-tertiary/30 to-bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
            <StatsCard
              icon={Star}
              label="Average Rating"
              value={`${stats.averageRating} / 5.0`}
            />
            <StatsCard
              icon={MessageSquare}
              label="Total Reviews"
              value={stats.totalReviews.toString()}
            />
          </div>
        </div>
      </section>

      {/* Filters and Reviews */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Filters & Sort */}
          <div className="mb-8 flex flex-wrap items-center gap-4 p-4 rounded-lg bg-bg-secondary border border-border-subtle">
            {/* Rating Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-cyan-glow" />
              <span className="text-sm font-medium text-text-primary">Rating:</span>
            </div>
            <Select value={filterRating} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[140px] input-glow">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent className="bg-bg-secondary border-border-subtle">
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">⭐ 5 Stars</SelectItem>
                <SelectItem value="4">⭐ 4 Stars</SelectItem>
                <SelectItem value="3">⭐ 3 Stars</SelectItem>
                <SelectItem value="2">⭐ 2 Stars</SelectItem>
                <SelectItem value="1">⭐ 1 Star</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden md:block h-6 w-px bg-border-subtle" />

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-cyan-glow" />
              <span className="text-sm font-medium text-text-primary">Sort:</span>
            </div>
            <Select value={sortBy} onValueChange={(v) => handleSortChange(v as SortOption)}>
              <SelectTrigger className="w-40 input-glow">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-bg-secondary border-border-subtle">
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="highest">Highest Rated</SelectItem>
                <SelectItem value="lowest">Lowest Rated</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
              </SelectContent>
            </Select>

            {/* Results count */}
            <div className="ml-auto text-sm text-text-muted">
              {filteredAndSortedReviews.length} review{filteredAndSortedReviews.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Reviews Grid */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: pageSize }).map((_, i) => (
                <ReviewSkeleton key={i} />
              ))}
            </div>
          ) : filteredAndSortedReviews.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-20 px-4"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="mb-6"
              >
                <div className="relative">
                  <Star className="h-20 w-20 text-text-muted/30" />
                  <Sparkles className="h-8 w-8 text-cyan-glow absolute -top-2 -right-2 animate-pulse" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold text-text-primary mb-3">No Reviews Found</h2>
              <p className="text-text-secondary text-center max-w-md mb-6">
                {filterRating === 'all' 
                  ? 'Be the first to share your experience! Complete a purchase and tell others what you think.'
                  : `No ${filterRating}-star reviews match your criteria. Try a different filter or browse all reviews.`
                }
              </p>
              <div className="flex gap-3">
                {filterRating !== 'all' && (
                  <Button 
                    variant="outline" 
                    className="btn-outline"
                    onClick={() => handleFilterChange('all')}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button asChild className="btn-primary shadow-glow-cyan-sm">
                  <Link href="/catalog">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Products
                  </Link>
                </Button>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedReviews.map((review) => {
                  // Cast to access optional properties not in SDK type
                  const extendedReview = review as unknown as {
                    productName?: string;
                    productSlug?: string;
                    orderItems?: ReviewOrderItem[];
                  };
                  return (
                    <ReviewCard
                      key={review.id}
                      id={review.id}
                      rating={review.rating}
                      title={review.title ?? undefined}
                      content={review.content}
                      authorName={review.authorName}
                      isVerifiedPurchase={review.isVerifiedPurchase}
                      productName={extendedReview.productName}
                      productSlug={extendedReview.productSlug}
                      orderItems={extendedReview.orderItems}
                      createdAt={new Date(review.createdAt).toISOString()}
                    />
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    className="btn-outline"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    className="btn-outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1 px-4">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          className={cn(
                            'w-10 h-10 p-0',
                            page === pageNum ? 'btn-primary' : 'btn-outline'
                          )}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    className="btn-outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    className="btn-outline"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                  >
                    Last
                  </Button>
                </div>
              )}
            </>
          )}

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-16 text-center"
          >
            <Card className="max-w-2xl mx-auto bg-gradient-primary-subtle border-neon-cyan shadow-glow-cyan card-interactive-glow">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-cyan-glow animate-glow-pulse" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-text-primary">Your Opinion Matters</h3>
                <p className="text-text-secondary max-w-md mx-auto">
                  Already a BitLoot customer? After receiving your digital keys, you can leave a review to help fellow gamers discover the best deals. Every verified review builds our trusted community.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

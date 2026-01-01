'use client';

import React, { useState } from 'react';
import { Star, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/design-system/primitives/badge';
import { Button } from '@/design-system/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { Skeleton } from '@/design-system/primitives/skeleton';
import { useHomepageReviews, usePublicReviews, useMyReviews } from '../hooks/useReviews';
import { cn } from '@/design-system/utils/utils';

// Star Rating Display Component
function StarRating({ rating, size = 'default' }: { rating: number; size?: 'sm' | 'default' }): React.ReactElement {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-muted text-muted-foreground'
          )}
        />
      ))}
    </div>
  );
}

// Single Review Card
interface ReviewCardProps {
  rating: number;
  title?: string;
  content: string;
  authorName: string;
  isVerifiedPurchase: boolean;
  productName?: string;
  createdAt: string;
  showProductName?: boolean;
}

function ReviewCard({
  rating,
  title,
  content,
  authorName,
  isVerifiedPurchase,
  productName,
  createdAt,
  showProductName = false,
}: ReviewCardProps): React.ReactElement {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Header: Rating and Verified Badge */}
          <div className="flex items-center justify-between gap-2">
            <StarRating rating={rating} />
            {isVerifiedPurchase && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>

          {/* Title */}
          {title != null && title.length > 0 && (
            <h4 className="font-semibold text-foreground">{title}</h4>
          )}

          {/* Content */}
          <p className="text-sm text-muted-foreground line-clamp-4">
            {content}
          </p>

          {/* Footer: Author, Product, Date */}
          <div className="pt-2 border-t flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium">{authorName}</span>
            {showProductName && productName != null && productName.length > 0 && (
              <>
                <span>•</span>
                <span>{productName}</span>
              </>
            )}
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton for Review Card
function ReviewCardSkeleton(): React.ReactElement {
  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-5 w-5 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="pt-2 border-t flex gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Homepage Reviews Section
interface HomepageReviewsProps {
  limit?: number;
  title?: string;
  description?: string;
}

export function HomepageReviews({
  limit = 6,
  title = 'What Our Customers Say',
  description = 'Hear from our satisfied customers',
}: HomepageReviewsProps): React.ReactElement | null {
  const { data, isLoading, error } = useHomepageReviews(limit);

  if (error != null) {
    return null; // Silently fail for homepage widget
  }

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            <p className="text-muted-foreground mt-2">{description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: limit > 3 ? 3 : limit }).map((_, i) => (
              <ReviewCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // useHomepageReviews returns ReviewResponseDto[] directly (an array)
  const reviews = data ?? [];

  if (reviews.length === 0) {
    return null; // Don't show section if no reviews
  }

  return (
    <section className="py-12">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              rating={review.rating}
              title={review.title != null ? String(review.title) : undefined}
              content={review.content}
              authorName={review.authorName}
              isVerifiedPurchase={review.isVerifiedPurchase}
              productName={review.productName != null ? String(review.productName) : undefined}
              createdAt={review.createdAt.toISOString()}
              showProductName
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Product Reviews List with Pagination
interface ProductReviewsProps {
  productId: string;
  pageSize?: number;
}

export function ProductReviews({ productId, pageSize = 5 }: ProductReviewsProps): React.ReactElement {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = usePublicReviews(productId, page, pageSize);

  // Compute pagination values from data
  const totalPages = data?.totalPages ?? 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ReviewCardSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error != null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load reviews at this time.</p>
        </CardContent>
      </Card>
    );
  }

  const reviews = data?.data ?? [];

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
          <CardDescription>No reviews yet for this product</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Be the first to review this product after your purchase!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Customer Reviews</CardTitle>
            <CardDescription>
              {data?.total ?? 0} review{(data?.total ?? 0) !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <StarRating rating={review.rating} size="sm" />
                  {review.isVerifiedPurchase && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                {review.title != null && String(review.title).length > 0 && (
                  <h4 className="font-medium">{String(review.title)}</h4>
                )}
                <p className="text-sm text-muted-foreground">{review.content}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{review.authorName}</span>
                  <span>•</span>
                  <span>
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// User's Own Reviews List
interface MyReviewsListProps {
  pageSize?: number;
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
}

export function MyReviewsList({ pageSize = 10, onEdit, onDelete }: MyReviewsListProps): React.ReactElement {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useMyReviews(page, pageSize);

  // Compute pagination values from data
  const totalPages = data?.totalPages ?? 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <ReviewCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error != null) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load your reviews.</p>
      </div>
    );
  }

  const reviews = data?.data ?? [];

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          You haven&apos;t written any reviews yet. After making a purchase, you can leave a review!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <StarRating rating={review.rating} />
                <div className="flex gap-2">
                  {onEdit != null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(review.id)}
                    >
                      Edit
                    </Button>
                  )}
                  {onDelete != null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(review.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              {review.title != null && String(review.title).length > 0 && (
                <h4 className="font-semibold">{String(review.title)}</h4>
              )}
              <p className="text-sm text-muted-foreground">{review.content}</p>
              <div className="pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
                {review.productName != null && String(review.productName).length > 0 && (
                  <>
                    <span>{String(review.productName)}</span>
                    <span>•</span>
                  </>
                )}
                <span>
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={!hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={!hasNextPage}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export { StarRating, ReviewCard, ReviewCardSkeleton };

'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/design-system/primitives/alert';
import { Button } from '@/design-system/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/design-system/primitives/card';
import { Input } from '@/design-system/primitives/input';
import { Label } from '@/design-system/primitives/label';
import { Textarea } from '@/design-system/primitives/textarea';
import { useReviewForm } from '../hooks/useReviews';
import { cn } from '@/design-system/utils/utils';

interface ReviewFormProps {
  orderId: string;
  productId?: string;
  productName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Interactive Star Rating Component
function StarRatingInput({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}): React.ReactElement {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          disabled={disabled}
          className={cn(
            'transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              'h-8 w-8 transition-colors',
              (hoverValue !== 0 ? hoverValue : value) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted-foreground'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({
  orderId,
  productId,
  productName,
  onSuccess,
  onCancel,
}: ReviewFormProps): React.ReactElement {
  const {
    canReview,
    isCheckingEligibility,
    submitReview,
    isSubmitting,
    submitError,
    submitSuccess,
  } = useReviewForm(orderId);

  // Form state
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');

  // Validation
  const [errors, setErrors] = useState<{
    rating?: string;
    content?: string;
    authorName?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (rating < 1 || rating > 5) {
      newErrors.rating = 'Please select a rating between 1 and 5 stars';
    }
    
    if (content.trim().length === 0 || content.length < 10) {
      newErrors.content = 'Please write a review with at least 10 characters';
    }

    if (content.length > 2000) {
      newErrors.content = 'Review must be less than 2000 characters';
    }

    if (authorName.trim().length === 0) {
      newErrors.authorName = 'Please enter a display name';
    } else if (authorName.trim().length < 2) {
      newErrors.authorName = 'Display name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await submitReview({
        orderId,
        productId,
        rating,
        title: title.trim().length > 0 ? title.trim() : undefined,
        content: content.trim(),
        authorName: authorName.trim().length > 0 ? authorName.trim() : undefined,
      });

      // Show success toast
      toast.success('Review Submitted!', {
        description: 'Thank you! Your review has been submitted.',
        duration: 3000,
      });

      // Wait 2 seconds before closing to let user see the success message
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      // Error is handled by the mutation state
      console.error('Failed to submit review:', err);
      toast.error('Failed to submit review', {
        description: 'Please try again later.',
      });
    }
  };

  // Loading state while checking eligibility
  if (isCheckingEligibility) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Checking if you can leave a review...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not eligible to review
  if (!canReview) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cannot Leave a Review</AlertTitle>
            <AlertDescription>
              You may have already reviewed this order, or the order is not yet completed.
              Reviews can only be submitted for completed orders that haven&apos;t been reviewed yet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">Thank You for Your Review!</h3>
              <p className="text-muted-foreground mt-1">
                Your review has been submitted and is pending approval.
                It will be visible once our team reviews it.
              </p>
            </div>
            {onCancel != null && (
              <Button variant="outline" onClick={onCancel}>
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave a Review</CardTitle>
        <CardDescription>
          {productName != null && productName.length > 0
            ? `Share your experience with ${productName}` 
            : 'Share your experience with this product'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {submitError != null && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Submission Failed</AlertTitle>
              <AlertDescription>
                {submitError instanceof Error 
                  ? submitError.message 
                  : 'Failed to submit your review. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Star Rating */}
          <div className="space-y-2">
            <Label>
              Rating <span className="text-destructive">*</span>
            </Label>
            <StarRatingInput
              value={rating}
              onChange={setRating}
              disabled={isSubmitting}
            />
            {errors.rating != null && (
              <p className="text-sm text-destructive">{errors.rating}</p>
            )}
          </div>

          {/* Title (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="review-title">Review Title (Optional)</Label>
            <Input
              id="review-title"
              placeholder="Summarize your experience"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              maxLength={100}
            />
          </div>

          {/* Review Content */}
          <div className="space-y-2">
            <Label htmlFor="review-content">
              Your Review <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="review-content"
              placeholder="Tell us what you think about this product..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              className="resize-none"
              maxLength={2000}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{errors.content != null && <span className="text-destructive">{errors.content}</span>}</span>
              <span>{content.length}/2000</span>
            </div>
          </div>

          {/* Author Name (Required) */}
          <div className="space-y-2">
            <Label htmlFor="author-name">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="author-name"
              placeholder="Enter your display name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              disabled={isSubmitting}
              maxLength={50}
            />
            {errors.authorName != null && (
              <p className="text-sm text-destructive">{errors.authorName}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            {onCancel != null && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ReviewForm;

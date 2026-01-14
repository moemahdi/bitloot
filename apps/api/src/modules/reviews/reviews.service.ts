import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, IsNull } from 'typeorm';
import { Review, ReviewStatus } from '../../database/entities/review.entity';
import { Order } from '../orders/order.entity';
import { User } from '../../database/entities/user.entity';
import { Product } from '../catalog/entities/product.entity';
import {
  CreateReviewDto,
  UpdateReviewDto,
  AdminCreateReviewDto,
  AdminUpdateReviewDto,
  ModerateReviewDto,
  ReviewResponseDto,
  AdminReviewResponseDto,
  PaginatedReviewsDto,
  PaginatedAdminReviewsDto,
  ReviewStatsDto,
  ReviewOrderItemDto,
} from './dto';

export interface ReviewFilters {
  status?: ReviewStatus;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  displayOnHomepage?: boolean;
  isVerifiedPurchase?: boolean;
  productId?: string;
  userId?: string;
  orderId?: string;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // ============ CUSTOMER OPERATIONS ============

  /**
   * Create a review for an order (customer action)
   */
  async createReview(
    dto: CreateReviewDto,
    userId: string | null,
    email?: string,
  ): Promise<Review> {
    // Verify order exists and is fulfilled
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId },
      relations: ['user'],
    });

    if (order === undefined || order === null) {
      throw new NotFoundException('Order not found');
    }

    // Check order is fulfilled
    if (order.status !== 'fulfilled') {
      throw new BadRequestException('Can only review fulfilled orders');
    }

    // Verify ownership
    if (userId !== undefined && userId !== null && order.userId !== userId) {
      throw new ForbiddenException('You can only review your own orders');
    }

    // For guest orders, verify email matches
    if ((userId === undefined || userId === null) && email !== undefined && email !== null && email !== '' && order.email !== email) {
      throw new ForbiddenException('Email does not match order');
    }

    // Check for existing review on this order (and product if specified)
    const existingReview = await this.reviewRepo.findOne({
      where: {
        orderId: dto.orderId,
        productId: dto.productId ?? IsNull(),
        deletedAt: IsNull(),
      } as FindOptionsWhere<Review>,
    });

    if (existingReview !== undefined && existingReview !== null) {
      throw new ConflictException('You have already reviewed this order');
    }

    // If productId is provided, verify it's part of the order
    if (dto.productId !== undefined && dto.productId !== null && dto.productId !== '') {
      const product = await this.productRepo.findOne({
        where: { id: dto.productId },
      });
      if (product === undefined || product === null) {
        throw new NotFoundException('Product not found');
      }
    }

    // Create review
    const review = this.reviewRepo.create({
      orderId: dto.orderId,
      userId: userId ?? null,
      productId: dto.productId ?? null,
      rating: dto.rating,
      title: dto.title ?? null,
      content: dto.content,
      authorName: dto.authorName ?? null,
      status: ReviewStatus.PENDING,
      isVerifiedPurchase: true,
      displayOnHomepage: false,
    });

    const savedReview = await this.reviewRepo.save(review);

    // Reload with user relation to enable getDisplayName() to work correctly
    const reloadedReview = await this.reviewRepo.findOne({
      where: { id: savedReview.id },
      relations: ['user', 'product'],
    });

    return reloadedReview ?? savedReview;
  }

  /**
   * Update a customer's own review (only allowed while pending)
   */
  async updateOwnReview(
    reviewId: string,
    dto: UpdateReviewDto,
    userId: string,
  ): Promise<Review> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
      relations: ['user', 'product'],
    });

    if (review === undefined || review === null) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Cannot edit reviews after moderation');
    }

    // Update fields
    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.title !== undefined) review.title = dto.title;
    if (dto.content !== undefined) review.content = dto.content;
    if (dto.authorName !== undefined) review.authorName = dto.authorName;

    const savedReview = await this.reviewRepo.save(review);

    // Reload with relations to ensure getDisplayName() works
    const reloadedReview = await this.reviewRepo.findOne({
      where: { id: savedReview.id },
      relations: ['user', 'product'],
    });

    return reloadedReview ?? savedReview;
  }

  /**
   * Delete a customer's own review
   */
  async deleteOwnReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
    });

    if (review === undefined || review === null) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewRepo.softDelete(reviewId);
  }

  /**
   * Get a customer's reviews
   */
  async getUserReviews(
    userId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedReviewsDto> {
    const { page, limit } = pagination;

    const [reviews, total] = await this.reviewRepo.findAndCount({
      where: { userId, deletedAt: IsNull() } as FindOptionsWhere<Review>,
      relations: ['product', 'user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: reviews.map((r) => this.toPublicResponse(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Check if user can review an order
   */
  async canReviewOrder(orderId: string, userId: string | null, email?: string): Promise<boolean> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
    });

    if (order === undefined || order === null) return false;
    if (order.status !== 'fulfilled') return false;

    // Check ownership
    if (userId !== undefined && userId !== null && order.userId !== userId) return false;
    if ((userId === undefined || userId === null) && email !== undefined && email !== null && email !== '' && order.email !== email) return false;

    // Check for existing review
    const existingReview = await this.reviewRepo.findOne({
      where: { orderId, deletedAt: IsNull() } as FindOptionsWhere<Review>,
    });

    return existingReview === undefined || existingReview === null;
  }

  // ============ ADMIN OPERATIONS ============

  /**
   * Admin: Create a review manually (e.g., testimonials)
   */
  async adminCreateReview(
    dto: AdminCreateReviewDto,
    adminId: string,
  ): Promise<AdminReviewResponseDto> {
    // For admin-created reviews, orderId is optional
    // If provided, verify it exists
    if (dto.orderId !== undefined && dto.orderId !== null && dto.orderId !== '') {
      const order = await this.orderRepo.findOne({
        where: { id: dto.orderId },
      });
      if (order === undefined || order === null) {
        throw new NotFoundException('Order not found');
      }
    }

    // If productId provided, verify it exists
    if (dto.productId !== undefined && dto.productId !== null && dto.productId !== '') {
      const product = await this.productRepo.findOne({
        where: { id: dto.productId },
      });
      if (product === undefined || product === null) {
        throw new NotFoundException('Product not found');
      }
    }

    const status = dto.status ?? ReviewStatus.PENDING;

    const review = this.reviewRepo.create({
      orderId: dto.orderId ?? null as unknown as string, // Allow null for admin-created reviews
      productId: dto.productId ?? null,
      rating: dto.rating,
      title: dto.title ?? null,
      content: dto.content,
      authorName: dto.authorName,
      status,
      displayOnHomepage: dto.displayOnHomepage ?? false,
      isVerifiedPurchase: dto.isVerifiedPurchase ?? false,
      adminNotes: dto.adminNotes ?? null,
      approvedById: status !== ReviewStatus.PENDING ? adminId : null,
      approvedAt: status !== ReviewStatus.PENDING ? new Date() : null,
    });

    const savedReview = await this.reviewRepo.save(review);

    // Load relations for response
    const fullReview = await this.reviewRepo.findOne({
      where: { id: savedReview.id },
      relations: ['user', 'product', 'approvedBy'],
    });

    return this.toAdminResponse(fullReview!);
  }

  /**
   * Admin: Update any review
   */
  async adminUpdateReview(
    reviewId: string,
    dto: AdminUpdateReviewDto,
    adminId: string,
  ): Promise<AdminReviewResponseDto> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
    });

    if (review === undefined || review === null) {
      throw new NotFoundException('Review not found');
    }

    // Update fields
    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.title !== undefined) review.title = dto.title;
    if (dto.content !== undefined) review.content = dto.content;
    if (dto.authorName !== undefined) review.authorName = dto.authorName;
    if (dto.displayOnHomepage !== undefined) review.displayOnHomepage = dto.displayOnHomepage;
    if (dto.adminNotes !== undefined) review.adminNotes = dto.adminNotes;

    // If status is being changed
    if (dto.status !== undefined && dto.status !== review.status) {
      review.status = dto.status;
      if (dto.status !== ReviewStatus.PENDING) {
        review.approvedById = adminId;
        review.approvedAt = new Date();
      }
    }

    await this.reviewRepo.save(review);

    // Load relations for response
    const fullReview = await this.reviewRepo.findOne({
      where: { id: reviewId },
      relations: ['user', 'product', 'approvedBy'],
    });

    return this.toAdminResponse(fullReview!);
  }

  /**
   * Admin: Moderate (approve/reject) a review
   */
  async moderateReview(
    reviewId: string,
    dto: ModerateReviewDto,
    adminId: string,
  ): Promise<AdminReviewResponseDto> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
    });

    if (review === undefined || review === null) {
      throw new NotFoundException('Review not found');
    }

    review.status = dto.status;
    review.approvedById = adminId;
    review.approvedAt = new Date();

    if (dto.displayOnHomepage !== undefined) {
      review.displayOnHomepage = dto.displayOnHomepage;
    }

    if (dto.adminNotes !== undefined && dto.adminNotes !== null && dto.adminNotes !== '') {
      review.adminNotes = review.adminNotes !== null && review.adminNotes !== undefined && review.adminNotes !== ''
        ? `${review.adminNotes}\n---\n${dto.adminNotes}`
        : dto.adminNotes;
    }

    await this.reviewRepo.save(review);

    // Load relations for response
    const fullReview = await this.reviewRepo.findOne({
      where: { id: reviewId },
      relations: ['user', 'product', 'approvedBy'],
    });

    return this.toAdminResponse(fullReview!);
  }

  /**
   * Admin: Delete any review
   */
  async adminDeleteReview(reviewId: string): Promise<void> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
    });

    if (review === undefined || review === null) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewRepo.softDelete(reviewId);
  }

  /**
   * Admin: Get all reviews with filters
   */
  async adminGetReviews(
    filters: ReviewFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedAdminReviewsDto> {
    const { page, limit } = pagination;

    const queryBuilder = this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.product', 'product')
      .leftJoinAndSelect('review.approvedBy', 'approvedBy')
      .leftJoinAndSelect('review.order', 'order')
      .leftJoinAndSelect('order.items', 'items')
      .where('review.deletedAt IS NULL');

    // Apply filters
    if (filters.status !== undefined && filters.status !== null) {
      queryBuilder.andWhere('review.status = :status', { status: filters.status });
    }

    if (filters.rating !== undefined && filters.rating !== null) {
      queryBuilder.andWhere('review.rating = :rating', { rating: filters.rating });
    }

    if (filters.minRating !== undefined) {
      queryBuilder.andWhere('review.rating >= :minRating', { minRating: filters.minRating });
    }

    if (filters.maxRating !== undefined) {
      queryBuilder.andWhere('review.rating <= :maxRating', { maxRating: filters.maxRating });
    }

    if (filters.displayOnHomepage !== undefined) {
      queryBuilder.andWhere('review.displayOnHomepage = :homepage', {
        homepage: filters.displayOnHomepage,
      });
    }

    if (filters.isVerifiedPurchase !== undefined) {
      queryBuilder.andWhere('review.isVerifiedPurchase = :verified', {
        verified: filters.isVerifiedPurchase,
      });
    }

    if (filters.productId !== undefined && filters.productId !== null && filters.productId !== '') {
      queryBuilder.andWhere('review.productId = :productId', {
        productId: filters.productId,
      });
    }

    if (filters.userId !== undefined && filters.userId !== null && filters.userId !== '') {
      queryBuilder.andWhere('review.userId = :userId', { userId: filters.userId });
    }

    if (filters.orderId !== undefined && filters.orderId !== null && filters.orderId !== '') {
      queryBuilder.andWhere('review.orderId = :orderId', { orderId: filters.orderId });
    }

    if (filters.search !== undefined && filters.search !== null && filters.search !== '') {
      queryBuilder.andWhere(
        '(review.title ILIKE :search OR review.content ILIKE :search OR review.authorName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    queryBuilder
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    // Collect all unique product IDs from order items
    const allProductIds = new Set<string>();
    for (const review of reviews) {
      if (review.order?.items !== undefined && review.order.items !== null) {
        for (const item of review.order.items) {
          allProductIds.add(item.productId);
        }
      }
      if (review.productId !== undefined && review.productId !== null) {
        allProductIds.add(review.productId);
      }
    }

    // Fetch all products at once
    const productMap = new Map<string, Product>();
    if (allProductIds.size > 0) {
      const products = await this.productRepo.findByIds([...allProductIds]);
      for (const product of products) {
        productMap.set(product.id, product);
      }
    }

    return {
      data: reviews.map((r) => this.toAdminResponseWithItems(r, productMap)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin: Get single review by ID
   */
  async adminGetReview(reviewId: string): Promise<AdminReviewResponseDto> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
      relations: ['user', 'product', 'approvedBy'],
    });

    if (review === undefined || review === null) {
      throw new NotFoundException('Review not found');
    }

    return this.toAdminResponse(review);
  }

  /**
   * Get review statistics
   */
  async getStats(): Promise<ReviewStatsDto> {
    // Get total approved reviews and average rating
    const result: { total: string; average: string } | undefined =
      await this.reviewRepo
        .createQueryBuilder('review')
        .select('COUNT(*)', 'total')
        .addSelect('AVG(review.rating)', 'average')
        .where('review.status = :status', { status: ReviewStatus.APPROVED })
        .andWhere('review.deletedAt IS NULL')
        .getRawOne();

    // Get rating breakdown
    const ratingBreakdown: Array<{ rating: number; count: string }> =
      await this.reviewRepo
        .createQueryBuilder('review')
        .select('review.rating', 'rating')
        .addSelect('COUNT(*)', 'count')
        .where('review.status = :status', { status: ReviewStatus.APPROVED })
        .andWhere('review.deletedAt IS NULL')
        .groupBy('review.rating')
        .getRawMany();

    // Get status breakdown
    const statusBreakdown: Array<{ status: string; count: string }> =
      await this.reviewRepo
        .createQueryBuilder('review')
        .select('review.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('review.deletedAt IS NULL')
        .groupBy('review.status')
        .getRawMany();

    const ratingMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of ratingBreakdown) {
      ratingMap[Number(r.rating)] = Number(r.count);
    }

    const statusMap: Record<string, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    for (const s of statusBreakdown) {
      statusMap[s.status] = Number(s.count);
    }

    return {
      totalReviews: Number(result?.total ?? 0),
      averageRating: Math.round((Number(result?.average ?? 0) + Number.EPSILON) * 10) / 10,
      ratingBreakdown: ratingMap,
      statusBreakdown: statusMap,
    };
  }

  // ============ PUBLIC OPERATIONS ============

  /**
   * Get approved reviews for public display
   */
  async getPublicReviews(
    pagination: PaginationOptions,
    options?: { productId?: string; homepageOnly?: boolean },
  ): Promise<PaginatedReviewsDto> {
    const { page, limit } = pagination;

    const queryBuilder = this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.product', 'product')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.order', 'order')
      .leftJoinAndSelect('order.items', 'items')
      .where('review.status = :status', { status: ReviewStatus.APPROVED })
      .andWhere('review.deletedAt IS NULL');

    if (options?.productId !== undefined && options.productId !== null && options.productId !== '') {
      // Include reviews where:
      // 1. The review's direct productId matches, OR
      // 2. The product is in the order's items (for multi-item orders)
      // Use CAST to handle uuid/varchar type difference between review.productId and items.productId
      queryBuilder.andWhere(
        '(review.productId = :productId OR items.productId = CAST(:productId AS VARCHAR))',
        { productId: options.productId },
      );
    }

    if (options?.homepageOnly === true) {
      queryBuilder.andWhere('review.displayOnHomepage = true');
    }

    queryBuilder
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    // Collect all unique product IDs from order items
    const allProductIds = new Set<string>();
    for (const review of reviews) {
      if (review.order?.items !== undefined && review.order.items !== null) {
        for (const item of review.order.items) {
          allProductIds.add(item.productId);
        }
      }
      if (review.productId !== undefined && review.productId !== null) {
        allProductIds.add(review.productId);
      }
    }

    // Fetch all products at once
    const productMap = new Map<string, Product>();
    if (allProductIds.size > 0) {
      const products = await this.productRepo.findByIds([...allProductIds]);
      for (const product of products) {
        productMap.set(product.id, product);
      }
    }

    return {
      data: reviews.map((r) => this.toPublicResponseWithItems(r, productMap)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get homepage reviews (approved + displayOnHomepage)
   */
  async getHomepageReviews(limit: number = 6): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewRepo.find({
      where: {
        status: ReviewStatus.APPROVED,
        displayOnHomepage: true,
        deletedAt: IsNull(),
      } as FindOptionsWhere<Review>,
      relations: ['product', 'user', 'order', 'order.items'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    // Collect all unique product IDs from order items
    const allProductIds = new Set<string>();
    for (const review of reviews) {
      if (review.order?.items !== undefined && review.order.items !== null) {
        for (const item of review.order.items) {
          allProductIds.add(item.productId);
        }
      }
      if (review.productId !== undefined && review.productId !== null) {
        allProductIds.add(review.productId);
      }
    }

    // Fetch all products at once
    const productMap = new Map<string, Product>();
    if (allProductIds.size > 0) {
      const products = await this.productRepo.findByIds([...allProductIds]);
      for (const product of products) {
        productMap.set(product.id, product);
      }
    }

    return reviews.map((r) => this.toPublicResponseWithItems(r, productMap));
  }

  // ============ RESPONSE MAPPERS ============

  /**
   * Map review to public response with order items
   */
  private toPublicResponseWithItems(
    review: Review,
    productMap: Map<string, Product>,
  ): ReviewResponseDto {
    // Build order items array if order has items
    const orderItems: ReviewResponseDto['orderItems'] = [];
    if (review.order?.items !== undefined && review.order.items !== null && review.order.items.length > 0) {
      for (const item of review.order.items) {
        const product = productMap.get(item.productId);
        orderItems.push({
          productId: item.productId,
          productTitle: product?.title ?? item.productId,
          productSlug: product?.slug ?? null,
          quantity: item.quantity ?? 1,
        });
      }
    }

    return {
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      authorName: review.getDisplayName(),
      isVerifiedPurchase: review.isVerifiedPurchase,
      productName: review.product?.title ?? null,
      productId: review.productId ?? null,
      productSlug: review.product?.slug ?? null,
      orderItems: orderItems.length > 0 ? orderItems : undefined,
      createdAt: review.createdAt,
    };
  }

  private toPublicResponse(review: Review): ReviewResponseDto {
    return {
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      authorName: review.getDisplayName(),
      isVerifiedPurchase: review.isVerifiedPurchase,
      productName: review.product?.title ?? null,
      productId: review.productId ?? null,
      productSlug: review.product?.slug ?? null,
      createdAt: review.createdAt,
    };
  }

  private toAdminResponse(review: Review): AdminReviewResponseDto {
    return {
      id: review.id,
      orderId: review.orderId ?? null,
      userId: review.userId,
      userEmail: review.user?.email ?? null,
      productId: review.productId,
      productName: review.product?.title ?? null,
      rating: review.rating,
      title: review.title,
      content: review.content,
      authorName: review.authorName ?? review.getDisplayName(),
      isVerifiedPurchase: review.isVerifiedPurchase,
      status: review.status,
      displayOnHomepage: review.displayOnHomepage,
      adminNotes: review.adminNotes,
      approvedById: review.approvedById,
      approvedByEmail: review.approvedBy?.email ?? null,
      approvedAt: review.approvedAt,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  private toAdminResponseWithItems(
    review: Review,
    productMap: Map<string, Product>,
  ): AdminReviewResponseDto {
    // Build orderItems array from order.items
    const orderItems: AdminReviewResponseDto['orderItems'] = [];
    if (review.order?.items !== undefined && review.order.items !== null && review.order.items.length > 0) {
      for (const item of review.order.items) {
        const product = productMap.get(item.productId);
        orderItems.push({
          productId: item.productId,
          productTitle: product?.title ?? item.productId,
          productSlug: product?.slug ?? null,
          quantity: item.quantity ?? 1,
        });
      }
    }

    // Get the first product name for backward compatibility
    let productName: string | null = review.product?.title ?? null;
    if (productName === null && orderItems.length > 0 && orderItems[0] !== undefined) {
      productName = orderItems[0].productTitle;
    }

    return {
      id: review.id,
      orderId: review.orderId ?? null,
      userId: review.userId,
      userEmail: review.user?.email ?? null,
      productId: review.productId,
      productName,
      rating: review.rating,
      title: review.title,
      content: review.content,
      authorName: review.authorName ?? review.getDisplayName(),
      isVerifiedPurchase: review.isVerifiedPurchase,
      status: review.status,
      displayOnHomepage: review.displayOnHomepage,
      adminNotes: review.adminNotes,
      approvedById: review.approvedById,
      approvedByEmail: review.approvedBy?.email ?? null,
      approvedAt: review.approvedAt,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      orderItems: orderItems.length > 0 ? orderItems : undefined,
    };
  }
}

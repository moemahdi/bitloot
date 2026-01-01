import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  PaginatedReviewsDto,
} from './dto';

interface AuthenticatedRequest {
  user?: {
    id: string;
    email: string;
  };
}

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ============ PUBLIC ENDPOINTS ============

  @Get()
  @ApiOperation({ summary: 'Get approved reviews (public)' })
  @ApiResponse({ status: 200, type: PaginatedReviewsDto })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 50)' })
  @ApiQuery({ name: 'productId', required: false, type: String, description: 'Filter by product ID' })
  async getPublicReviews(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('productId') productId?: string,
  ): Promise<PaginatedReviewsDto> {
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const pageNum = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage);
    const limitNum = Math.min(50, Math.max(1, Number.isNaN(parsedLimit) ? 10 : parsedLimit));

    return this.reviewsService.getPublicReviews(
      { page: pageNum, limit: limitNum },
      { productId },
    );
  }

  @Get('homepage')
  @ApiOperation({ summary: 'Get homepage reviews (featured, approved)' })
  @ApiResponse({ status: 200, type: [ReviewResponseDto] })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of reviews (default: 6, max: 12)' })
  async getHomepageReviews(
    @Query('limit') limit = '6',
  ): Promise<ReviewResponseDto[]> {
    const parsedLimit = parseInt(limit, 10);
    const limitNum = Math.min(12, Math.max(1, Number.isNaN(parsedLimit) ? 6 : parsedLimit));
    return this.reviewsService.getHomepageReviews(limitNum);
  }

  // ============ CUSTOMER ENDPOINTS ============

  @Post()
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit a review for an order' })
  @ApiResponse({ status: 201, type: ReviewResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request or order not eligible for review' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 409, description: 'Review already exists for this order' })
  async createReview(
    @Body() dto: CreateReviewDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.createReview(
      dto,
      req.user?.id ?? null,
      req.user?.email,
    );

    return {
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      authorName: review.getDisplayName(),
      isVerifiedPurchase: review.isVerifiedPurchase,
      productName: null,
      createdAt: review.createdAt,
    };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user\'s reviews' })
  @ApiResponse({ status: 200, type: PaginatedReviewsDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyReviews(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<PaginatedReviewsDto> {
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const pageNum = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage);
    const limitNum = Math.min(50, Math.max(1, Number.isNaN(parsedLimit) ? 10 : parsedLimit));

    return this.reviewsService.getUserReviews(req.user!.id, {
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get('can-review/:orderId')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check if user can review an order' })
  @ApiResponse({ status: 200, schema: { type: 'object', properties: { canReview: { type: 'boolean' } } } })
  async canReviewOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ canReview: boolean }> {
    const canReview = await this.reviewsService.canReviewOrder(
      orderId,
      req.user?.id ?? null,
      req.user?.email,
    );
    return { canReview };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update own review (only while pending)' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot edit after moderation' })
  @ApiResponse({ status: 403, description: 'Cannot edit another user\'s review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async updateOwnReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.updateOwnReview(
      id,
      dto,
      req.user!.id,
    );

    return {
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      authorName: review.getDisplayName(),
      isVerifiedPurchase: review.isVerifiedPurchase,
      productName: null,
      createdAt: review.createdAt,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete own review' })
  @ApiResponse({ status: 204, description: 'Review deleted' })
  @ApiResponse({ status: 403, description: 'Cannot delete another user\'s review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteOwnReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.reviewsService.deleteOwnReview(id, req.user!.id);
  }
}

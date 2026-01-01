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
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { ReviewsService } from './reviews.service';
import {
  AdminCreateReviewDto,
  AdminUpdateReviewDto,
  ModerateReviewDto,
  AdminReviewResponseDto,
  PaginatedAdminReviewsDto,
  ReviewStatsDto,
} from './dto';
import { ReviewStatus } from '../../database/entities/review.entity';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

@ApiTags('Admin - Reviews')
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ============ LIST REVIEWS (with filters) ============
  @Get()
  @ApiOperation({ summary: 'List all reviews with filters (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 20, max 100)' })
  @ApiQuery({ name: 'status', required: false, enum: ReviewStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'productId', required: false, type: String, description: 'Filter by product ID' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID' })
  @ApiQuery({ name: 'displayOnHomepage', required: false, type: Boolean, description: 'Filter by homepage display' })
  @ApiQuery({ name: 'minRating', required: false, type: Number, description: 'Minimum rating (1-5)' })
  @ApiQuery({ name: 'maxRating', required: false, type: Number, description: 'Maximum rating (1-5)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in title/content/authorName' })
  @ApiResponse({ status: 200, description: 'Paginated list of reviews', type: PaginatedAdminReviewsDto })
  async getReviews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ReviewStatus,
    @Query('productId') productId?: string,
    @Query('userId') userId?: string,
    @Query('displayOnHomepage') displayOnHomepage?: string,
    @Query('minRating') minRating?: string,
    @Query('maxRating') maxRating?: string,
    @Query('search') search?: string,
  ): Promise<PaginatedAdminReviewsDto> {
    const pageNum = page !== undefined ? parseInt(page, 10) : 1;
    const limitNum = limit !== undefined ? Math.min(parseInt(limit, 10), 100) : 20;

    return this.reviewsService.adminGetReviews(
      {
        status,
        productId,
        userId,
        displayOnHomepage: displayOnHomepage === 'true' ? true : displayOnHomepage === 'false' ? false : undefined,
        minRating: minRating !== undefined ? parseInt(minRating, 10) : undefined,
        maxRating: maxRating !== undefined ? parseInt(maxRating, 10) : undefined,
        search,
      },
      { page: pageNum, limit: limitNum },
    );
  }

  // ============ GET STATS ============
  @Get('stats')
  @ApiOperation({ summary: 'Get review statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Review statistics', type: ReviewStatsDto })
  async getStats(): Promise<ReviewStatsDto> {
    return this.reviewsService.getStats();
  }

  // ============ GET SINGLE REVIEW ============
  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID (admin)' })
  @ApiParam({ name: 'id', type: String, description: 'Review ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Review details', type: AdminReviewResponseDto })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async getReview(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminReviewResponseDto> {
    return this.reviewsService.adminGetReview(id);
  }

  // ============ CREATE REVIEW (Admin) ============
  @Post()
  @ApiOperation({ summary: 'Create a review (admin)' })
  @ApiResponse({ status: 201, description: 'Review created', type: AdminReviewResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createReview(
    @Body() dto: AdminCreateReviewDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AdminReviewResponseDto> {
    return this.reviewsService.adminCreateReview(dto, req.user.id);
  }

  // ============ UPDATE REVIEW (Admin) ============
  @Put(':id')
  @ApiOperation({ summary: 'Update review (admin)' })
  @ApiParam({ name: 'id', type: String, description: 'Review ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Review updated', type: AdminReviewResponseDto })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async updateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateReviewDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AdminReviewResponseDto> {
    return this.reviewsService.adminUpdateReview(id, dto, req.user.id);
  }

  // ============ MODERATE REVIEW ============
  @Put(':id/moderate')
  @ApiOperation({ summary: 'Moderate review (approve/reject)' })
  @ApiParam({ name: 'id', type: String, description: 'Review ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Review moderated', type: AdminReviewResponseDto })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async moderateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateReviewDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AdminReviewResponseDto> {
    return this.reviewsService.moderateReview(id, dto, req.user.id);
  }

  // ============ TOGGLE HOMEPAGE DISPLAY ============
  @Put(':id/toggle-homepage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle homepage display for review' })
  @ApiParam({ name: 'id', type: String, description: 'Review ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Homepage display toggled', type: AdminReviewResponseDto })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async toggleHomepageDisplay(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<AdminReviewResponseDto> {
    // Get current review
    const review = await this.reviewsService.adminGetReview(id);
    // Toggle the displayOnHomepage flag
    return this.reviewsService.adminUpdateReview(id, {
      displayOnHomepage: !review.displayOnHomepage,
    }, req.user.id);
  }

  // ============ DELETE REVIEW ============
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete review (admin)' })
  @ApiParam({ name: 'id', type: String, description: 'Review ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Review deleted' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteReview(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.reviewsService.adminDeleteReview(id);
  }

  // ============ BULK APPROVE ============
  @Post('bulk-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk approve reviews' })
  @ApiResponse({ status: 200, description: 'Reviews approved', schema: { properties: { count: { type: 'number' } } } })
  async bulkApprove(
    @Body() body: { ids: string[] },
    @Request() req: AuthenticatedRequest,
  ): Promise<{ count: number }> {
    let count = 0;
    for (const id of body.ids) {
      try {
        await this.reviewsService.moderateReview(
          id,
          { status: ReviewStatus.APPROVED },
          req.user.id,
        );
        count++;
      } catch {
        // Skip failed reviews
      }
    }
    return { count };
  }

  // ============ BULK REJECT ============
  @Post('bulk-reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk reject reviews' })
  @ApiResponse({ status: 200, description: 'Reviews rejected', schema: { properties: { count: { type: 'number' } } } })
  async bulkReject(
    @Body() body: { ids: string[]; adminNotes?: string },
    @Request() req: AuthenticatedRequest,
  ): Promise<{ count: number }> {
    let count = 0;
    for (const id of body.ids) {
      try {
        await this.reviewsService.moderateReview(
          id,
          { status: ReviewStatus.REJECTED, adminNotes: body.adminNotes },
          req.user.id,
        );
        count++;
      } catch {
        // Skip failed reviews
      }
    }
    return { count };
  }

  // ============ BULK DELETE ============
  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete reviews' })
  @ApiResponse({ status: 200, description: 'Reviews deleted', schema: { properties: { count: { type: 'number' } } } })
  async bulkDelete(
    @Body() body: { ids: string[] },
  ): Promise<{ count: number }> {
    let count = 0;
    for (const id of body.ids) {
      try {
        await this.reviewsService.adminDeleteReview(id);
        count++;
      } catch {
        // Skip failed reviews
      }
    }
    return { count };
  }
}

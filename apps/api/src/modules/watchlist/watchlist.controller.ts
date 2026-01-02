import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WatchlistService } from './watchlist.service';
import {
  AddToWatchlistDto,
  WatchlistItemResponseDto,
  PaginatedWatchlistResponseDto,
  CheckWatchlistResponseDto,
  GetWatchlistQueryDto,
} from './dto/watchlist.dto';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Watchlist')
@Controller('watchlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user\'s watchlist' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated watchlist items',
    type: PaginatedWatchlistResponseDto,
  })
  async getWatchlist(
    @Request() req: AuthenticatedRequest,
    @Query() query: GetWatchlistQueryDto,
  ): Promise<PaginatedWatchlistResponseDto> {
    return this.watchlistService.getWatchlist(
      req.user.id,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Add a product to watchlist' })
  @ApiResponse({
    status: 201,
    description: 'Product added to watchlist successfully',
    type: WatchlistItemResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Product already in watchlist',
  })
  async addToWatchlist(
    @Request() req: AuthenticatedRequest,
    @Body() dto: AddToWatchlistDto,
  ): Promise<WatchlistItemResponseDto> {
    return this.watchlistService.addToWatchlist(req.user.id, dto.productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a product from watchlist' })
  @ApiParam({
    name: 'productId',
    description: 'Product ID to remove from watchlist',
  })
  @ApiResponse({
    status: 204,
    description: 'Product removed from watchlist successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found in watchlist',
  })
  async removeFromWatchlist(
    @Request() req: AuthenticatedRequest,
    @Param('productId') productId: string,
  ): Promise<void> {
    return this.watchlistService.removeFromWatchlist(req.user.id, productId);
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Check if a product is in watchlist' })
  @ApiParam({
    name: 'productId',
    description: 'Product ID to check',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns whether product is in watchlist',
    type: CheckWatchlistResponseDto,
  })
  async checkWatchlist(
    @Request() req: AuthenticatedRequest,
    @Param('productId') productId: string,
  ): Promise<CheckWatchlistResponseDto> {
    return this.watchlistService.checkWatchlist(req.user.id, productId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total number of items in watchlist' })
  @ApiResponse({
    status: 200,
    description: 'Returns watchlist count',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 5 },
      },
    },
  })
  async getWatchlistCount(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ count: number }> {
    const count = await this.watchlistService.getWatchlistCount(req.user.id);
    return { count };
  }
}

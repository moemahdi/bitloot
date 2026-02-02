import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchlistItem } from '../../database/entities/watchlist-item.entity';
import { Product } from '../catalog/entities/product.entity';
import {
  WatchlistItemResponseDto,
  WatchlistProductDto,
  PaginatedWatchlistResponseDto,
  CheckWatchlistResponseDto,
} from './dto/watchlist.dto';

@Injectable()
export class WatchlistService {
  private readonly logger = new Logger(WatchlistService.name);

  constructor(
    @InjectRepository(WatchlistItem)
    private readonly watchlistRepo: Repository<WatchlistItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  /**
   * Add a product to user's watchlist (idempotent - returns existing if already added)
   */
  async addToWatchlist(
    userId: string,
    productId: string,
  ): Promise<WatchlistItemResponseDto> {
    // Check if product exists
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (product === null) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if already in watchlist - return existing item (idempotent)
    const existing = await this.watchlistRepo.findOne({
      where: { userId, productId },
    });

    if (existing !== null) {
      this.logger.log(
        `Product ${productId} already in watchlist for user ${userId}`,
      );
      return this.toResponseDto(existing, product);
    }

    // Create watchlist item with conflict handling
    try {
      const watchlistItem = this.watchlistRepo.create({
        userId,
        productId,
      });

      const saved = await this.watchlistRepo.save(watchlistItem);
      this.logger.log(
        `User ${userId} added product ${productId} to watchlist`,
      );

      return this.toResponseDto(saved, product);
    } catch (error: unknown) {
      // Handle race condition - if another request inserted first, return existing
      if (error instanceof Error && error.message.includes('duplicate key')) {
        const existingItem = await this.watchlistRepo.findOne({
          where: { userId, productId },
        });
        if (existingItem !== null) {
          return this.toResponseDto(existingItem, product);
        }
      }
      throw error;
    }
  }

  /**
   * Remove a product from user's watchlist
   */
  async removeFromWatchlist(userId: string, productId: string): Promise<void> {
    const result = await this.watchlistRepo.delete({
      userId,
      productId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Item not found in watchlist');
    }

    this.logger.log(
      `User ${userId} removed product ${productId} from watchlist`,
    );
  }

  /**
   * Get user's watchlist with pagination
   */
  async getWatchlist(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedWatchlistResponseDto> {
    const skip = (page - 1) * limit;

    const [items, total] = await this.watchlistRepo.findAndCount({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const data = items.map((item) => this.toResponseDto(item, item.product));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Check if a product is in user's watchlist
   */
  async checkWatchlist(
    userId: string,
    productId: string,
  ): Promise<CheckWatchlistResponseDto> {
    const item = await this.watchlistRepo.findOne({
      where: { userId, productId },
    });

    return {
      isInWatchlist: item !== null,
      watchlistItemId: item?.id,
    };
  }

  /**
   * Get watchlist count for a user
   */
  async getWatchlistCount(userId: string): Promise<number> {
    return this.watchlistRepo.count({ where: { userId } });
  }

  /**
   * Check multiple products at once (for product listings)
   */
  async checkMultipleProducts(
    userId: string,
    productIds: string[],
  ): Promise<Map<string, boolean>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const items = await this.watchlistRepo.find({
      where: productIds.map((productId) => ({ userId, productId })),
      select: ['productId'],
    });

    const watchlistSet = new Set(items.map((item) => item.productId));
    const result = new Map<string, boolean>();

    for (const productId of productIds) {
      result.set(productId, watchlistSet.has(productId));
    }

    return result;
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(
    item: WatchlistItem,
    product: Product,
  ): WatchlistItemResponseDto {
    const productDto: WatchlistProductDto = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      subtitle: product.subtitle ?? null,
      coverImageUrl: product.coverImageUrl ?? null,
      platform: product.platform ?? null,
      region: product.region ?? null,
      price: Number(product.price),
      isPublished: product.isPublished,
    };

    return {
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      product: productDto,
      createdAt: item.createdAt,
    };
  }
}

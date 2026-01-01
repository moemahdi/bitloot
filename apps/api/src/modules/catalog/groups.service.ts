import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { ProductGroup } from './entities/product-group.entity';
import { Product } from './entities/product.entity';
import {
  CreateProductGroupDto,
  UpdateProductGroupDto,
  ProductGroupResponseDto,
  ProductGroupWithProductsDto,
  GroupProductVariantDto,
  ProductGroupListResponseDto,
  ListProductGroupsQueryDto,
} from './dto/product-group.dto';

/**
 * Service for managing product groups
 * 
 * Groups allow consolidating multiple product variants (different platforms,
 * editions, regions) into a single card in the catalog.
 */
@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(ProductGroup)
    private readonly groupRepo: Repository<ProductGroup>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new product group
   */
  async create(dto: CreateProductGroupDto): Promise<ProductGroupResponseDto> {
    // Generate slug if not provided
    const slug = dto.slug ?? this.generateSlug(dto.title);

    // Check for duplicate slug
    const existing = await this.groupRepo.findOne({ where: { slug } });
    if (existing !== null) {
      throw new ConflictException(`Group with slug "${slug}" already exists`);
    }

    const group = this.groupRepo.create({
      title: dto.title,
      slug,
      description: dto.description,
      coverImageUrl: dto.coverImageUrl,
      tagline: dto.tagline,
      isActive: dto.isActive ?? true,
      displayOrder: dto.displayOrder ?? 0,
      minPrice: '0.00000000',
      maxPrice: '0.00000000',
      productCount: 0,
    });

    const saved = await this.groupRepo.save(group);
    return this.toResponseDto(saved);
  }

  /**
   * Update an existing product group
   */
  async update(id: string, dto: UpdateProductGroupDto): Promise<ProductGroupResponseDto> {
    const group = await this.findOneOrThrow(id);

    // Check for duplicate slug if being changed
    if (dto.slug !== undefined && dto.slug !== '' && dto.slug !== group.slug) {
      const existing = await this.groupRepo.findOne({ where: { slug: dto.slug } });
      if (existing !== null) {
        throw new ConflictException(`Group with slug "${dto.slug}" already exists`);
      }
    }

    // Apply updates
    if (dto.title !== undefined) group.title = dto.title;
    if (dto.slug !== undefined) group.slug = dto.slug;
    if (dto.description !== undefined) group.description = dto.description;
    if (dto.coverImageUrl !== undefined) group.coverImageUrl = dto.coverImageUrl;
    if (dto.tagline !== undefined) group.tagline = dto.tagline;
    if (dto.isActive !== undefined) group.isActive = dto.isActive;
    if (dto.displayOrder !== undefined) group.displayOrder = dto.displayOrder;

    const saved = await this.groupRepo.save(group);
    return this.toResponseDto(saved);
  }

  /**
   * Delete a product group
   * Products in the group will have their groupId set to null
   */
  async delete(id: string): Promise<void> {
    const group = await this.findOneOrThrow(id);

    // Remove products from group (set groupId to null)
    await this.productRepo.update({ groupId: id }, { groupId: undefined });

    // Delete the group
    await this.groupRepo.remove(group);
  }

  /**
   * Get a product group by ID
   */
  async findById(id: string): Promise<ProductGroupResponseDto> {
    const group = await this.findOneOrThrow(id);
    return this.toResponseDto(group);
  }

  /**
   * Get a product group by slug
   */
  async findBySlug(slug: string): Promise<ProductGroupResponseDto> {
    const group = await this.groupRepo.findOne({ where: { slug } });
    if (group === null) {
      throw new NotFoundException(`Group with slug "${slug}" not found`);
    }
    return this.toResponseDto(group);
  }

  /**
   * Get a product group with all its products
   */
  async findByIdWithProducts(id: string): Promise<ProductGroupWithProductsDto> {
    const group = await this.groupRepo.findOne({
      where: { id },
      relations: ['products'],
    });

    if (group === null) {
      throw new NotFoundException(`Group with ID "${id}" not found`);
    }

    // Filter to only published products and sort by price
    const publishedProducts = (group.products ?? [])
      .filter((p) => p.isPublished)
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    return {
      ...this.toResponseDto(group),
      products: publishedProducts.map((p) => this.toProductVariantDto(p)),
    };
  }

  /**
   * Get a product group by slug with all its products
   */
  async findBySlugWithProducts(slug: string): Promise<ProductGroupWithProductsDto> {
    const group = await this.groupRepo.findOne({
      where: { slug },
      relations: ['products'],
    });

    if (group === null) {
      throw new NotFoundException(`Group with slug "${slug}" not found`);
    }

    // Filter to only published products and sort by price
    const publishedProducts = (group.products ?? [])
      .filter((p) => p.isPublished)
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    return {
      ...this.toResponseDto(group),
      products: publishedProducts.map((p) => this.toProductVariantDto(p)),
    };
  }

  /**
   * List all groups with pagination and filters
   */
  async findAll(query: ListProductGroupsQueryDto): Promise<ProductGroupListResponseDto> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    }

    if (query.search !== undefined && query.search !== '') {
      whereClause.title = ILike(`%${query.search}%`);
    }

    const [groups, total] = await this.groupRepo.findAndCount({
      where: whereClause,
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      groups: groups.map((g) => this.toResponseDto(g)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * List all active groups for public catalog
   */
  async findAllActive(): Promise<ProductGroupResponseDto[]> {
    const groups = await this.groupRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });

    return groups.map((g) => this.toResponseDto(g));
  }

  // ============================================
  // PRODUCT ASSIGNMENT
  // ============================================

  /**
   * Assign products to a group
   */
  async assignProducts(groupId: string, productIds: string[]): Promise<ProductGroupWithProductsDto> {
    await this.findOneOrThrow(groupId);

    // Verify all products exist
    const products = await this.productRepo.findBy({ id: In(productIds) });
    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(`Products not found: ${missingIds.join(', ')}`);
    }

    // Assign products to group
    await this.productRepo.update({ id: In(productIds) }, { groupId });

    // Update group stats
    await this.updateGroupStats(groupId);

    return this.findByIdWithProducts(groupId);
  }

  /**
   * Remove products from a group
   */
  async removeProducts(groupId: string, productIds: string[]): Promise<ProductGroupWithProductsDto> {
    await this.findOneOrThrow(groupId);

    // Remove products from group (only if they belong to this group)
    await this.productRepo
      .createQueryBuilder()
      .update(Product)
      .set({ groupId: undefined })
      .where('id IN (:...ids)', { ids: productIds })
      .andWhere('groupId = :groupId', { groupId })
      .execute();

    // Update group stats
    await this.updateGroupStats(groupId);

    return this.findByIdWithProducts(groupId);
  }

  /**
   * Get all products available for assignment (not in any group)
   */
  async getUnassignedProducts(): Promise<GroupProductVariantDto[]> {
    const products = await this.productRepo.find({
      where: { groupId: undefined },
      order: { title: 'ASC' },
    });

    return products.map((p) => this.toProductVariantDto(p));
  }

  /**
   * Get products in a specific group
   */
  async getGroupProducts(groupId: string): Promise<GroupProductVariantDto[]> {
    await this.findOneOrThrow(groupId);

    const products = await this.productRepo.find({
      where: { groupId },
      order: { price: 'ASC' },
    });

    return products.map((p) => this.toProductVariantDto(p));
  }

  // ============================================
  // STATS & HELPERS
  // ============================================

  /**
   * Update cached stats for a group (min/max price, product count)
   */
  async updateGroupStats(groupId: string): Promise<void> {
    const products = await this.productRepo.find({
      where: { groupId, isPublished: true },
      select: ['price'],
    });

    const prices = products.map((p) => parseFloat(p.price)).filter((p) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices).toFixed(8) : '0.00000000';
    const maxPrice = prices.length > 0 ? Math.max(...prices).toFixed(8) : '0.00000000';

    await this.groupRepo.update(groupId, {
      minPrice,
      maxPrice,
      productCount: products.length,
    });

    // If no cover image set, use first product's cover
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (group !== null && (group.coverImageUrl === null || group.coverImageUrl === '')) {
      const firstProduct = await this.productRepo.findOne({
        where: { groupId, isPublished: true },
        order: { price: 'ASC' },
      });
      if (firstProduct !== null && firstProduct.coverImageUrl !== null && firstProduct.coverImageUrl !== '') {
        await this.groupRepo.update(groupId, { coverImageUrl: firstProduct.coverImageUrl });
      }
    }
  }

  /**
   * Update stats for all groups (e.g., after bulk price changes)
   */
  async updateAllGroupStats(): Promise<void> {
    const groups = await this.groupRepo.find({ select: ['id'] });
    for (const group of groups) {
      await this.updateGroupStats(group.id);
    }
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async findOneOrThrow(id: string): Promise<ProductGroup> {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (group === null) {
      throw new NotFoundException(`Group with ID "${id}" not found`);
    }
    return group;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private toResponseDto(group: ProductGroup): ProductGroupResponseDto {
    return {
      id: group.id,
      title: group.title,
      slug: group.slug,
      description: group.description,
      coverImageUrl: group.coverImageUrl,
      tagline: group.tagline,
      isActive: group.isActive,
      displayOrder: group.displayOrder,
      minPrice: group.minPrice,
      maxPrice: group.maxPrice,
      productCount: group.productCount,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  private toProductVariantDto(product: Product): GroupProductVariantDto {
    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      platform: product.platform,
      region: product.region,
      subtitle: product.subtitle,
      price: product.price,
      currency: product.currency,
      coverImageUrl: product.coverImageUrl,
      rating: product.rating !== null && product.rating !== undefined ? parseFloat(product.rating.toString()) : undefined,
      isPublished: product.isPublished,
      sourceType: product.sourceType,
    };
  }
}

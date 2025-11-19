import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductOffer } from './entities/product-offer.entity';
import { DynamicPricingRule } from './entities/dynamic-pricing-rule.entity';
import { KinguinOfferRaw } from './kinguin-catalog.client';

// Internal interface for pricing rule calculations
interface PricingRuleData {
  rule_type: string;
  marginPercent?: string;
  fixedMarkupMinor?: number;
  floorMinor?: number;
  capMinor?: number;
}

/**
 * CatalogService - Product catalog management with pricing and offers
 */
@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductOffer) private offerRepo: Repository<ProductOffer>,
    @InjectRepository(DynamicPricingRule) private pricingRuleRepo: Repository<DynamicPricingRule>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create or update product from provider offer
   */
  async upsertProduct(offer: KinguinOfferRaw): Promise<Product> {
    const externalId = offer.id;
    
    if (typeof externalId !== 'string' || externalId.length === 0) {
      throw new Error('Missing offer ID');
    }

    let product = await this.productRepo.findOne({
      where: { externalId },
      relations: ['offers'],
    });

    if (product === null) {
      // Create new product from offer
      product = this.productRepo.create({
        externalId,
        slug: this.slugify(offer.title, externalId),
        title: offer.title,
        costMinor: offer.price_minor,
        currency: offer.currency,
        priceMinor: offer.price_minor,
        isPublished: false,
        isCustom: false,
      });
    } else {
      // Update existing product cost if offer cost changed
      if (offer.price_minor < product.costMinor) {
        product.costMinor = offer.price_minor;
      }
    }

    return this.productRepo.save(product);
  }

  /**
   * Create or associate offer with product
   */
  async createOffer(
    productId: string,
    data: { provider: string; providerSku: string; costMinor: number; currency?: string },
  ): Promise<ProductOffer> {
    const product = await this.productRepo.findOne({ where: { id: productId } });

    if (product === null) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }

    const offer = this.offerRepo.create({
      productId,
      provider: data.provider,
      providerSku: data.providerSku,
      costMinor: data.costMinor,
      currency: data.currency ?? 'USD',
      isActive: true,
    });

    return this.offerRepo.save(offer);
  }

  /**
   * Calculate selling price based on cost and pricing rules
   */
  calculatePrice(product: Product, costMinor: number): number {
    let price = costMinor;

    // Get applicable pricing rule (product-specific or default)
    const rule = this.getPricingRule(product.id);

    switch (rule.rule_type) {
      case 'margin_percent': {
        const marginPercent = Number(rule.marginPercent ?? 8);
        const margin = marginPercent / 100;
        price = Math.ceil(costMinor * (1 + margin));
        break;
      }

      case 'fixed_markup': {
        const markupMinor = rule.fixedMarkupMinor ?? 0;
        price = costMinor + markupMinor;
        break;
      }

      case 'floor_cap': {
        // Apply floor and cap
        price = costMinor;
        break;
      }

      case 'dynamic_adjust': {
        // For now, treat as margin_percent
        const marginPercent = Number(rule.marginPercent ?? 8);
        const margin = marginPercent / 100;
        price = Math.ceil(costMinor * (1 + margin));
        break;
      }

      default:
        price = Math.ceil(costMinor * 1.1); // 10% default
    }

    // Apply floor (minimum selling price)
    if (typeof rule.floorMinor === 'number' && rule.floorMinor > 0 && price < rule.floorMinor) {
      price = rule.floorMinor;
    }

    // Apply cap (maximum selling price)
    if (typeof rule.capMinor === 'number' && rule.capMinor > 0 && price > rule.capMinor) {
      price = rule.capMinor;
    }

    return price;
  }

  /**
   * Get pricing rule for product (product-specific, category, or global default)
   */
  private getPricingRule(_productId: string): PricingRuleData {
    // For now, return a default rule
    // In future, implement rule hierarchy: product → category → global
    return {
      rule_type: 'margin_percent',
      marginPercent: '8',
      fixedMarkupMinor: undefined,
      floorMinor: undefined,
      capMinor: undefined,
    };
  }

  /**
   * Generate URL-safe slug from product title and external ID
   */
  slugify(title: string, externalId: string): string {
    // Normalize unicode (NFD = decomposed form, é -> e + combining accent)
    const normalized = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    const slugged = normalized
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars (keep word chars, spaces, hyphens)
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length

    return `${slugged}-${externalId.substring(0, 6)}`;
  }

  /**
   * Publish/unpublish a product
   */
  async setPublished(productId: string, isPublished: boolean): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id: productId } });

    if (product === null) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }

    product.isPublished = isPublished;
    return this.productRepo.save(product);
  }

  /**
   * List products with filtering and pagination
   */
  async listProducts(
    limit: number = 24,
    offset: number = 0,
    filters: {
      q?: string;
      platform?: string;
      region?: string;
      category?: string;
      sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating';
    } = {},
  ): Promise<{ data: Product[]; total: number; limit: number; offset: number; pages: number }> {
    let query = this.productRepo
      .createQueryBuilder('product')
      .where('product.isPublished = true');

    // Search by title/subtitle (full-text)
    if (typeof filters.q === 'string' && filters.q.length > 0) {
      query = query.andWhere(
        `product.searchTsv @@ plainto_tsquery('simple', :q)`,
        { q: filters.q },
      );
    }

    // Filter by platform
    if (typeof filters.platform === 'string' && filters.platform.length > 0) {
      query = query.andWhere('product.platform = :platform', {
        platform: filters.platform,
      });
    }

    // Filter by region
    if (typeof filters.region === 'string' && filters.region.length > 0) {
      query = query.andWhere('product.region = :region', {
        region: filters.region,
      });
    }

    // Filter by category
    if (typeof filters.category === 'string' && filters.category.length > 0) {
      query = query.andWhere('product.category = :category', {
        category: filters.category,
      });
    }

    // Sorting
    switch (filters.sort) {
      case 'price_asc':
        query = query.orderBy('product.priceMinor', 'ASC');
        break;
      case 'price_desc':
        query = query.orderBy('product.priceMinor', 'DESC');
        break;
      case 'rating':
        query = query.orderBy('product.rating', 'DESC');
        break;
      case 'newest':
      default:
        query = query.orderBy('product.createdAt', 'DESC');
    }

    // Pagination (enforce limit ≤ 100)
    const actualLimit = Math.min(limit, 100);
    const [data, total] = await query
      .take(actualLimit)
      .skip(offset)
      .getManyAndCount();

    // Calculate total pages
    const pages = Math.ceil(total / actualLimit);

    return {
      data,
      total,
      limit: actualLimit,
      offset,
      pages,
    };
  }

  /**
   * Get single product by slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    return this.productRepo.findOne({
      where: { slug, isPublished: true },
      relations: ['offers', 'pricingRules'],
    });
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    return this.productRepo.findOne({
      where: { id },
      relations: ['offers', 'pricingRules'],
    });
  }

  /**
   * Get products by category
   */
  async getByCategory(category: string, limit: number = 20): Promise<Product[]> {
    return this.productRepo.find({
      where: { category, isPublished: true },
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Reprice a product based on current pricing rules
   */
  async repriceProduct(productId: string): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id: productId } });

    if (product === null) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }

    // Recompute price based on current pricing rules
    const newPrice = this.calculatePrice(product, product.costMinor);
    product.priceMinor = newPrice;

    await this.productRepo.save(product);
  }

  /**
   * List all pricing rules (admin only)
   */
  async listPricingRules(): Promise<DynamicPricingRule[]> {
    return this.pricingRuleRepo.find({
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get pricing rule by ID (admin only)
   */
  async getPricingRuleById(id: string): Promise<DynamicPricingRule> {
    const rule = await this.pricingRuleRepo.findOne({
      where: { id },
      relations: ['product'],
    });

    if (rule === null) {
      throw new NotFoundException(`Pricing rule not found: ${id}`);
    }

    return rule;
  }

  /**
   * Create new pricing rule (admin only)
   */
  async createPricingRule(data: {
    productId: string;
    ruleType: 'margin_percent' | 'fixed_markup' | 'floor_cap' | 'dynamic_adjust';
    marginPercent?: string;
    fixedMarkupMinor?: number;
    floorMinor?: number;
    capMinor?: number;
    priority?: number;
    isActive?: boolean;
  }): Promise<DynamicPricingRule> {
    // Verify product exists
    const product = await this.productRepo.findOne({
      where: { id: data.productId },
    });

    if (product === null) {
      throw new NotFoundException(`Product not found: ${data.productId}`);
    }

    const rule = this.pricingRuleRepo.create({
      productId: data.productId,
      rule_type: data.ruleType,
      marginPercent: data.marginPercent,
      fixedMarkupMinor: data.fixedMarkupMinor,
      floorMinor: data.floorMinor,
      capMinor: data.capMinor,
      priority: data.priority ?? 0,
      isActive: data.isActive ?? true,
    });

    return this.pricingRuleRepo.save(rule);
  }

  /**
   * Update pricing rule (admin only)
   */
  async updatePricingRule(
    id: string,
    data: Partial<{
      ruleType: 'margin_percent' | 'fixed_markup' | 'floor_cap' | 'dynamic_adjust';
      marginPercent?: string;
      fixedMarkupMinor?: number;
      floorMinor?: number;
      capMinor?: number;
      priority?: number;
      isActive?: boolean;
    }>,
  ): Promise<DynamicPricingRule> {
    const rule = await this.getPricingRuleById(id);

    if (typeof data.ruleType === 'string') rule.rule_type = data.ruleType;
    if (typeof data.marginPercent === 'string') rule.marginPercent = data.marginPercent;
    if (typeof data.fixedMarkupMinor === 'number') rule.fixedMarkupMinor = data.fixedMarkupMinor;
    if (typeof data.floorMinor === 'number') rule.floorMinor = data.floorMinor;
    if (typeof data.capMinor === 'number') rule.capMinor = data.capMinor;
    if (typeof data.priority === 'number') rule.priority = data.priority;
    if (typeof data.isActive === 'boolean') rule.isActive = data.isActive;

    return this.pricingRuleRepo.save(rule);
  }

  /**
   * Delete pricing rule (admin only)
   */
  async deletePricingRule(id: string): Promise<void> {
    const rule = await this.getPricingRuleById(id);
    await this.pricingRuleRepo.remove(rule);
  }

  /**
   * Apply pricing rule to product (admin only)
   */
  async applyPricingRuleToProduct(ruleId: string, productId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['pricingRules'],
    });

    if (product === null) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }

    // Recompute price based on current pricing rules
    const newPrice = this.calculatePrice(product, product.costMinor);
    product.priceMinor = newPrice;

    return this.productRepo.save(product);
  }

  /**
   * Create custom product (admin only)
   */
  async createCustomProduct(data: {
    title: string;
    subtitle?: string;
    description?: string;
    platform?: string;
    region?: string;
    drm?: string;
    ageRating?: string;
    category?: string;
    costMinor: number;
    priceMinor: number;
    currency?: string;
    isPublished?: boolean;
  }): Promise<Product> {
    const product = this.productRepo.create({
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      platform: data.platform,
      region: data.region,
      drm: data.drm,
      ageRating: data.ageRating,
      category: data.category,
      costMinor: data.costMinor,
      priceMinor: data.priceMinor,
      currency: data.currency ?? 'USD',
      isPublished: data.isPublished ?? false,
      isCustom: true,
      slug: this.slugify(data.title, data.title),
      externalId: `custom-${Date.now()}`,
    });

    return this.productRepo.save(product);
  }

  /**
   * Update product (admin only)
   */
  async updateProduct(
    id: string,
    data: Partial<{
      title: string;
      subtitle: string;
      description: string;
      platform: string;
      region: string;
      drm: string;
      ageRating: string;
      category: string;
      costMinor: number;
      priceMinor: number;
      currency: string;
    }>,
  ): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });

    if (product === null) {
      throw new NotFoundException(`Product not found: ${id}`);
    }

    if (typeof data.title === 'string') product.title = data.title;
    if (typeof data.subtitle === 'string') product.subtitle = data.subtitle;
    if (typeof data.description === 'string') product.description = data.description;
    if (typeof data.platform === 'string') product.platform = data.platform;
    if (typeof data.region === 'string') product.region = data.region;
    if (typeof data.drm === 'string') product.drm = data.drm;
    if (typeof data.ageRating === 'string') product.ageRating = data.ageRating;
    if (typeof data.category === 'string') product.category = data.category;
    if (typeof data.costMinor === 'number') product.costMinor = data.costMinor;
    if (typeof data.priceMinor === 'number') product.priceMinor = data.priceMinor;
    if (typeof data.currency === 'string') product.currency = data.currency;

    return this.productRepo.save(product);
  }

  /**
   * Delete product (admin only - hard delete)
   */
  async deleteProduct(id: string): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id } });

    if (product === null) {
      throw new NotFoundException(`Product not found: ${id}`);
    }

    await this.productRepo.remove(product);
  }

  /**
   * Publish product (set isPublished = true)
   */
  async publishProduct(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });

    if (product === null) {
      throw new NotFoundException(`Product not found: ${id}`);
    }

    product.isPublished = true;
    return this.productRepo.save(product);
  }

  /**
   * Unpublish product (set isPublished = false)
   */
  async unpublishProduct(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });

    if (product === null) {
      throw new NotFoundException(`Product not found: ${id}`);
    }

    product.isPublished = false;
    return this.productRepo.save(product);
  }

  /**
   * List all products (admin - no published filter)
   */
  async listAllProductsAdmin(
    search?: string,
    platform?: string,
    region?: string,
    published?: boolean,
  ): Promise<Product[]> {
    let query = this.productRepo.createQueryBuilder('product');

    // Optional search
    if (typeof search === 'string' && search.length > 0) {
      query = query.andWhere(
        `product.searchTsv @@ plainto_tsquery('simple', :search)`,
        { search },
      );
    }

    // Optional platform filter
    if (typeof platform === 'string' && platform.length > 0) {
      query = query.andWhere('product.platform = :platform', { platform });
    }

    // Optional region filter
    if (typeof region === 'string' && region.length > 0) {
      query = query.andWhere('product.region = :region', { region });
    }

    // Optional published filter
    if (typeof published === 'boolean') {
      query = query.andWhere('product.isPublished = :published', { published });
    }

    return query.orderBy('product.createdAt', 'DESC').getMany();
  }
}

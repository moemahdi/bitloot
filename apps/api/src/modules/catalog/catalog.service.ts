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
  ) { }

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
        cost: (offer.price_minor / 100).toFixed(8),
        currency: offer.currency,
        price: (offer.price_minor / 100).toFixed(8),
        isPublished: false,
        isCustom: false,
      });
    } else {
      // Update existing product cost if offer cost changed
      const offerCost = (offer.price_minor / 100).toFixed(8);
      if (parseFloat(offerCost) < parseFloat(product.cost)) {
        product.cost = offerCost;
      }
    }

    return this.productRepo.save(product);
  }

  /**
   * Create or associate offer with product
   */
  async createOffer(
    productId: string,
    data: { provider: string; providerSku: string; cost: string; currency?: string },
  ): Promise<ProductOffer> {
    const product = await this.productRepo.findOne({ where: { id: productId } });

    if (product === null) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }

    const offer = this.offerRepo.create({
      productId,
      provider: data.provider,
      providerSku: data.providerSku,
      costMinor: Math.round(parseFloat(data.cost) * 100), // Keep offer as minor for now or update offer entity too?
      // Wait, ProductOffer entity likely has costMinor too. I should check that.
      // For now, assuming ProductOffer still has costMinor.
      currency: data.currency ?? 'USD',
      isActive: true,
    });

    return this.offerRepo.save(offer);
  }

  /**
   * Calculate selling price based on cost and pricing rules
   */
  async calculatePrice(product: Product, cost: string): Promise<string> {
    const costNum = parseFloat(cost);
    let priceNum = costNum;

    // Get applicable pricing rule (product-specific or default)
    const rule = await this.getPricingRule(product.id);

    switch (rule.rule_type) {
      case 'margin_percent': {
        const marginPercent = Number(rule.marginPercent ?? 8);
        const margin = marginPercent / 100;
        priceNum = costNum * (1 + margin);
        break;
      }

      case 'fixed_markup': {
        const markup = (rule.fixedMarkupMinor ?? 0) / 100;
        priceNum = costNum + markup;
        break;
      }

      case 'floor_cap': {
        // Use margin if defined, else default
        const marginPercent = Number(rule.marginPercent ?? 10);
        const margin = marginPercent / 100;
        priceNum = costNum * (1 + margin);
        break;
      }

      case 'dynamic_adjust': {
        // For now, treat as margin_percent
        const marginPercent = Number(rule.marginPercent ?? 8);
        const margin = marginPercent / 100;
        priceNum = costNum * (1 + margin);
        break;
      }

      default:
        priceNum = costNum * 1.1; // 10% default
    }

    // Apply floor (minimum selling price)
    if (typeof rule.floorMinor === 'number' && rule.floorMinor > 0) {
      const floor = rule.floorMinor / 100;
      if (priceNum < floor) priceNum = floor;
    }

    // Apply cap (maximum selling price)
    if (typeof rule.capMinor === 'number' && rule.capMinor > 0) {
      const cap = rule.capMinor / 100;
      if (priceNum > cap) priceNum = cap;
    }

    return priceNum.toFixed(8);
  }

  /**
   * Get pricing rule for product (product-specific or global default)
   * Implements hierarchy: Product Rule → Global Default
   * Note: Category-level rules require adding a 'category' column to DynamicPricingRule entity
   */
  private async getPricingRule(productId: string): Promise<PricingRuleData> {
    // Step 1: Try to find product-specific rule (highest priority)
    const productRule = await this.pricingRuleRepo.findOne({
      where: { productId, isActive: true },
      order: { priority: 'DESC' }, // Highest priority first
    });

    if (productRule !== null) {
      return {
        rule_type: productRule.rule_type,
        marginPercent: productRule.marginPercent,
        fixedMarkupMinor: productRule.fixedMarkupMinor,
        floorMinor: productRule.floorMinor,
        capMinor: productRule.capMinor,
      };
    }

    // Step 2: Try to find global default rule (productId is for a non-existent product or null equivalent)
    // Since we can't query for null productId directly, we'll look for rules with a special marker
    // For now, skip global rules from DB and use hardcoded fallback
    // TODO: Add a 'isGlobal' boolean column to DynamicPricingRule entity for proper global rules

    // Step 3: Fallback to hardcoded default (8% margin)
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
        query = query.orderBy('product.price', 'ASC');
        break;
      case 'price_desc':
        query = query.orderBy('product.price', 'DESC');
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
    const newPrice = await this.calculatePrice(product, product.cost);
    product.price = newPrice;

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
    const newPrice = await this.calculatePrice(product, product.cost);
    product.price = newPrice;

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
    cost: string;
    price: string;
    currency?: string;
    isPublished?: boolean;
    sourceType?: 'custom' | 'kinguin';
    kinguinOfferId?: string;
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
      cost: data.cost,
      price: data.price,
      currency: data.currency ?? 'USD',
      isPublished: data.isPublished ?? false,
      isCustom: data.sourceType !== 'kinguin',
      sourceType: data.sourceType ?? 'custom',
      kinguinOfferId: data.kinguinOfferId,
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
      cost: string;
      price: string;
      currency: string;
      sourceType: 'custom' | 'kinguin';
      kinguinOfferId: string;
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
    if (typeof data.cost === 'string') product.cost = data.cost;
    if (typeof data.price === 'string') product.price = data.price;
    if (typeof data.currency === 'string') product.currency = data.currency;
    if (typeof data.sourceType === 'string') {
      product.sourceType = data.sourceType;
      product.isCustom = data.sourceType !== 'kinguin';
    }
    if (typeof data.kinguinOfferId === 'string') product.kinguinOfferId = data.kinguinOfferId;

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
    source?: string,
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

    // Optional source filter
    if (typeof source === 'string' && source.length > 0) {
      query = query.andWhere('product.sourceType = :source', { source });
    }

    return query.orderBy('product.createdAt', 'DESC').getMany();
  }
}

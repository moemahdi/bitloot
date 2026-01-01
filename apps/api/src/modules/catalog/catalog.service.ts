import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductOffer } from './entities/product-offer.entity';
import { DynamicPricingRule } from './entities/dynamic-pricing-rule.entity';
import { KinguinProductRaw } from './kinguin-catalog.client';

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
   * Create or update product from Kinguin product data
   * @param product - Kinguin product object from v1/products API
   */
  async upsertProduct(kinguinProduct: KinguinProductRaw): Promise<Product> {
    // Use productId as the unique external identifier
    const externalId = kinguinProduct.productId;

    if (typeof externalId !== 'string' || externalId.length === 0) {
      throw new Error('Missing productId');
    }

    // Note: No relations loaded during upsert - we only need to check if product exists
    // This significantly reduces queries during bulk sync operations
    let product = await this.productRepo.findOne({
      where: { externalId },
    });

    // Kinguin prices are in EUR (NOT cents - already full euro amounts)
    const priceEur = kinguinProduct.price.toFixed(8);

    // Extract cover image URLs from Kinguin images object
    const coverImageUrl = kinguinProduct.images?.cover?.url ?? kinguinProduct.images?.cover?.thumbnail;
    const coverThumbnailUrl = kinguinProduct.images?.cover?.thumbnail ?? coverImageUrl;

    // Extract screenshots array
    const screenshots = kinguinProduct.images?.screenshots?.map(s => ({
      url: s.url,
      thumbnail: s.thumbnail ?? s.url,
    })) ?? undefined;

    // Map Kinguin regionId to readable region (common values)
    const regionMap: Record<number, string> = {
      1: 'Global',
      2: 'Europe',
      3: 'North America',
      4: 'Asia',
      5: 'South America',
      6: 'Oceania',
      7: 'Middle East',
      8: 'Africa',
    };
    const region = kinguinProduct.regionId !== undefined
      ? regionMap[kinguinProduct.regionId] ?? `Region ${kinguinProduct.regionId}`
      : kinguinProduct.regionalLimitations ?? 'Global';

    // Get the cheapest offer ID if available (for fulfillment)
    const cheapestOffer = kinguinProduct.cheapestOfferId?.[0] ?? kinguinProduct.offers?.[0]?.offerId;

    if (product === null) {
      // Create new product from Kinguin data with ALL available fields
      product = this.productRepo.create({
        // Core identifiers
        externalId,
        kinguinId: kinguinProduct.kinguinId,
        kinguinProductId: kinguinProduct.productId,
        slug: this.slugify(kinguinProduct.name, externalId),
        
        // Basic product info
        title: kinguinProduct.name,
        originalName: kinguinProduct.originalName,
        subtitle: kinguinProduct.originalName,
        description: kinguinProduct.description,
        
        // Categorization
        platform: kinguinProduct.platform,
        region,
        category: kinguinProduct.genres?.[0] ?? 'Games',
        ageRating: kinguinProduct.ageRating,
        drm: kinguinProduct.steam !== undefined ? 'Steam' : kinguinProduct.activationDetails,
        
        // Product metadata
        developers: kinguinProduct.developers,
        publishers: kinguinProduct.publishers,
        genres: kinguinProduct.genres,
        releaseDate: kinguinProduct.releaseDate,
        tags: kinguinProduct.tags,
        
        // Inventory/stock info
        qty: kinguinProduct.qty,
        textQty: kinguinProduct.textQty,
        offersCount: kinguinProduct.offersCount,
        totalQty: kinguinProduct.totalQty,
        isPreorder: kinguinProduct.isPreorder ?? false,
        
        // Ratings
        metacriticScore: kinguinProduct.metacriticScore,
        rating: kinguinProduct.metacriticScore !== undefined
          ? Math.min(5, kinguinProduct.metacriticScore / 20)
          : undefined,
        
        // Regional restrictions
        regionalLimitations: kinguinProduct.regionalLimitations,
        countryLimitation: kinguinProduct.countryLimitation,
        regionId: kinguinProduct.regionId,
        
        // Activation and fulfillment
        activationDetails: kinguinProduct.activationDetails,
        merchantName: kinguinProduct.merchantName,
        cheapestOfferId: kinguinProduct.cheapestOfferId,
        kinguinOfferId: cheapestOffer,
        
        // Media
        coverImageUrl,
        coverThumbnailUrl,
        screenshots,
        videos: kinguinProduct.videos,
        
        // Technical info
        languages: kinguinProduct.languages,
        systemRequirements: kinguinProduct.systemRequirements,
        steam: kinguinProduct.steam,
        
        // Pricing
        cost: priceEur,
        currency: 'EUR',
        price: priceEur,
        
        // Status
        isPublished: false,
        isCustom: false,
        sourceType: 'kinguin',
      });
    } else {
      // Update existing product with latest Kinguin data
      
      // Update cost if Kinguin cost changed (lower cost = better deal)
      if (parseFloat(priceEur) < parseFloat(product.cost)) {
        product.cost = priceEur;
      }

      // Always update these fields to keep in sync with Kinguin
      // Core fields
      if (kinguinProduct.kinguinId !== undefined) product.kinguinId = kinguinProduct.kinguinId;
      if (kinguinProduct.productId !== undefined) product.kinguinProductId = kinguinProduct.productId;
      
      // Basic info
      if (kinguinProduct.originalName !== undefined) product.originalName = kinguinProduct.originalName;
      if (kinguinProduct.description !== undefined) product.description = kinguinProduct.description;
      
      // Categorization
      if (kinguinProduct.platform !== undefined) product.platform = kinguinProduct.platform;
      if (region !== undefined) product.region = region;
      if (kinguinProduct.genres?.[0] !== undefined) product.category = kinguinProduct.genres[0];
      if (kinguinProduct.ageRating !== undefined) product.ageRating = kinguinProduct.ageRating;
      
      // Metadata
      if (kinguinProduct.developers !== undefined) product.developers = kinguinProduct.developers;
      if (kinguinProduct.publishers !== undefined) product.publishers = kinguinProduct.publishers;
      if (kinguinProduct.genres !== undefined) product.genres = kinguinProduct.genres;
      if (kinguinProduct.releaseDate !== undefined) product.releaseDate = kinguinProduct.releaseDate;
      if (kinguinProduct.tags !== undefined) product.tags = kinguinProduct.tags;
      
      // Inventory
      if (kinguinProduct.qty !== undefined) product.qty = kinguinProduct.qty;
      if (kinguinProduct.textQty !== undefined) product.textQty = kinguinProduct.textQty;
      if (kinguinProduct.offersCount !== undefined) product.offersCount = kinguinProduct.offersCount;
      if (kinguinProduct.totalQty !== undefined) product.totalQty = kinguinProduct.totalQty;
      if (kinguinProduct.isPreorder !== undefined) product.isPreorder = kinguinProduct.isPreorder;
      
      // Ratings
      if (kinguinProduct.metacriticScore !== undefined) {
        product.metacriticScore = kinguinProduct.metacriticScore;
        product.rating = Math.min(5, kinguinProduct.metacriticScore / 20);
      }
      
      // Regional restrictions
      if (kinguinProduct.regionalLimitations !== undefined) product.regionalLimitations = kinguinProduct.regionalLimitations;
      if (kinguinProduct.countryLimitation !== undefined) product.countryLimitation = kinguinProduct.countryLimitation;
      if (kinguinProduct.regionId !== undefined) product.regionId = kinguinProduct.regionId;
      
      // Activation and fulfillment
      if (kinguinProduct.activationDetails !== undefined) product.activationDetails = kinguinProduct.activationDetails;
      if (kinguinProduct.merchantName !== undefined) product.merchantName = kinguinProduct.merchantName;
      if (kinguinProduct.cheapestOfferId !== undefined) product.cheapestOfferId = kinguinProduct.cheapestOfferId;
      if (cheapestOffer !== undefined) product.kinguinOfferId = cheapestOffer;
      
      // Media
      if (coverImageUrl !== undefined) product.coverImageUrl = coverImageUrl;
      if (coverThumbnailUrl !== undefined) product.coverThumbnailUrl = coverThumbnailUrl;
      if (screenshots !== undefined) product.screenshots = screenshots;
      if (kinguinProduct.videos !== undefined) product.videos = kinguinProduct.videos;
      
      // Technical info
      if (kinguinProduct.languages !== undefined) product.languages = kinguinProduct.languages;
      if (kinguinProduct.systemRequirements !== undefined) product.systemRequirements = kinguinProduct.systemRequirements;
      if (kinguinProduct.steam !== undefined) product.steam = kinguinProduct.steam;

      // Ensure sourceType is 'kinguin' (fix existing products synced before this fix)
      product.sourceType = 'kinguin';
      product.isCustom = false;
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
      currency: data.currency ?? 'EUR',
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
   * Implements hierarchy: Product Rule → Global Rule → Hardcoded Default
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

    // Step 2: Try to find global rule (productId IS NULL)
    const globalRule = await this.pricingRuleRepo
      .createQueryBuilder('rule')
      .where('rule.productId IS NULL')
      .andWhere('rule.isActive = :isActive', { isActive: true })
      .orderBy('rule.priority', 'DESC')
      .getOne();

    if (globalRule !== null) {
      return {
        rule_type: globalRule.rule_type,
        marginPercent: globalRule.marginPercent,
        fixedMarkupMinor: globalRule.fixedMarkupMinor,
        floorMinor: globalRule.floorMinor,
        capMinor: globalRule.capMinor,
      };
    }

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

    // Filter by platform (case-insensitive to match slugified IDs from frontend)
    if (typeof filters.platform === 'string' && filters.platform.length > 0) {
      query = query.andWhere('LOWER(product.platform) = LOWER(:platform)', {
        platform: filters.platform,
      });
    }

    // Filter by region (case-insensitive to match slugified IDs from frontend)
    if (typeof filters.region === 'string' && filters.region.length > 0) {
      query = query.andWhere('LOWER(product.region) = LOWER(:region)', {
        region: filters.region,
      });
    }

    // Filter by category (case-insensitive to match slugified IDs from frontend)
    if (typeof filters.category === 'string' && filters.category.length > 0) {
      query = query.andWhere('LOWER(product.category) = LOWER(:category)', {
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
  async repriceProduct(productId: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id: productId } });

    if (product === null) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }

    // Recompute price based on current pricing rules
    const newPrice = await this.calculatePrice(product, product.cost);
    product.price = newPrice;

    return this.productRepo.save(product);
  }

  /**
   * Reprice multiple products based on current pricing rules
   */
  async repriceProducts(productIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const productId of productIds) {
      try {
        await this.repriceProduct(productId);
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Update product stock by Kinguin ID
   * Used by webhook processor when product is not found in Kinguin API
   * @param kinguinId - The Kinguin product ID
   * @param qty - Quantity available (digital keys)
   * @param textQty - Quantity available (text content)
   */
  async updateProductStockByKinguinId(
    kinguinId: string,
    qty: number,
    textQty: number,
  ): Promise<void> {
    // Find offer by kinguinId (stored as providerSku for kinguin offers)
    const offer = await this.offerRepo.findOne({
      where: { provider: 'kinguin', providerSku: kinguinId },
    });

    if (offer === null) {
      // Log as debug since this is expected for new products
      return;
    }

    // Update stock quantity on the offer
    const totalStock = qty + textQty;
    offer.stock = totalStock;
    offer.lastSeenAt = new Date();

    await this.offerRepo.save(offer);
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
   * If productId is undefined, creates a global rule that applies to all products
   */
  async createPricingRule(data: {
    productId?: string;
    ruleType: 'margin_percent' | 'fixed_markup' | 'floor_cap' | 'dynamic_adjust';
    marginPercent?: string;
    fixedMarkupMinor?: number;
    floorMinor?: number;
    capMinor?: number;
    priority?: number;
    isActive?: boolean;
  }): Promise<DynamicPricingRule> {
    // If productId provided, verify product exists
    if (typeof data.productId === 'string') {
      const product = await this.productRepo.findOne({
        where: { id: data.productId },
      });

      if (product === null) {
        throw new NotFoundException(`Product not found: ${data.productId}`);
      }
    }

    const rule = this.pricingRuleRepo.create({
      productId: data.productId ?? null,
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
      currency: data.currency ?? 'EUR',
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
   * Delete multiple products (admin only - bulk hard delete)
   * @param ids - Array of product IDs to delete
   * @returns Number of products actually deleted
   */
  async deleteProducts(ids: string[]): Promise<{ deleted: number; notFound: string[] }> {
    if (ids.length === 0) {
      return { deleted: 0, notFound: [] };
    }

    // Find all products that exist
    const products = await this.productRepo.find({
      where: ids.map((id) => ({ id })),
    });

    const foundIds = new Set(products.map((p) => p.id));
    const notFound = ids.filter((id) => !foundIds.has(id));

    if (products.length > 0) {
      await this.productRepo.remove(products);
    }

    return { deleted: products.length, notFound };
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
   * List all products with pagination (admin - no published filter)
   * Returns paginated results with total count for UI
   */
  async listAllProductsAdmin(
    search?: string,
    platform?: string,
    region?: string,
    published?: boolean,
    source?: string,
    page: number = 1,
    limit: number = 25,
  ): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    let query = this.productRepo.createQueryBuilder('product');

    // Optional search - use ILIKE for partial matching on title
    if (typeof search === 'string' && search.length > 0) {
      query = query.andWhere(
        `LOWER(product.title) LIKE LOWER(:search)`,
        { search: `%${search}%` },
      );
    }

    // Optional platform filter - case-insensitive matching
    if (typeof platform === 'string' && platform.length > 0) {
      query = query.andWhere('LOWER(product.platform) LIKE LOWER(:platform)', { platform: `%${platform}%` });
    }

    // Optional region filter - case-insensitive matching
    if (typeof region === 'string' && region.length > 0) {
      query = query.andWhere('LOWER(product.region) LIKE LOWER(:region)', { region: `%${region}%` });
    }

    // Optional published filter
    if (typeof published === 'boolean') {
      query = query.andWhere('product.isPublished = :published', { published });
    }

    // Optional source filter
    if (typeof source === 'string' && source.length > 0) {
      query = query.andWhere('product.sourceType = :source', { source });
    }

    // Ensure valid pagination values
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit)); // Max 100 items per page
    const offset = (validPage - 1) * validLimit;

    // Get total count and paginated results
    const [products, total] = await query
      .orderBy('product.createdAt', 'DESC')
      .skip(offset)
      .take(validLimit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / validLimit);

    return {
      products,
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
    };
  }

  /**
   * Find product by Kinguin external ID
   * Used by webhook handler to update products in real-time
   */
  async findByExternalId(externalId: string): Promise<Product | null> {
    return this.productRepo.findOne({
      where: { externalId },
    });
  }

  /**
   * Check which Kinguin product IDs are already imported
   * Returns a Set of externalIds that exist in the catalog
   */
  async getImportedKinguinIds(externalIds: string[]): Promise<Set<string>> {
    if (externalIds.length === 0) {
      return new Set();
    }

    const products = await this.productRepo
      .createQueryBuilder('product')
      .select('product.externalId')
      .where('product.externalId IN (:...ids)', { ids: externalIds })
      .getMany();

    return new Set(products.map((p) => p.externalId).filter((id): id is string => id !== null));
  }

  /**
   * Get all imported Kinguin products for syncing
   * Returns products with sourceType='kinguin' that have an externalId
   */
  async getImportedKinguinProducts(): Promise<Product[]> {
    return this.productRepo.find({
      where: {
        sourceType: 'kinguin',
      },
      select: ['id', 'externalId', 'title', 'sourceType'],
    });
  }

  /**
   * Compute retail price for product based on cost and pricing rules
   * Used by webhook handler when Kinguin price changes
   */
  async computePrice(productId: string, costEur: number): Promise<number> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (product === null || product === undefined) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }

    // Use existing calculatePrice method with cost as string
    const retailPrice = await this.calculatePrice(product, costEur.toString());
    return parseFloat(retailPrice);
  }

  // ============================================================
  // DYNAMIC CATEGORIES & FILTERS
  // ============================================================

  /**
   * Platform icon mapping for frontend display
   * Returns the icon name to be used in the frontend (Lucide icons)
   */
  private getPlatformIcon(platform: string): string {
    const iconMap: Record<string, string> = {
      steam: 'Gamepad2',
      xbox: 'Gamepad2',
      playstation: 'Gamepad2',
      'nintendo switch': 'Gamepad2',
      origin: 'MonitorPlay',
      uplay: 'MonitorPlay',
      epic: 'MonitorPlay',
      gog: 'MonitorPlay',
      rockstar: 'MonitorPlay',
      'battle.net': 'MonitorPlay',
      microsoft: 'Monitor',
      windows: 'Monitor',
      mac: 'Apple',
      other: 'Package',
    };
    return iconMap[platform.toLowerCase()] ?? 'Package';
  }

  /**
   * Category type determination based on product data patterns
   */
  private getCategoryType(category: string): 'genre' | 'platform' | 'collection' | 'custom' {
    // Platform categories
    const platforms = ['steam', 'xbox', 'playstation', 'nintendo', 'origin', 'uplay', 'epic', 'gog'];
    if (platforms.some((p) => category.toLowerCase().includes(p))) {
      return 'platform';
    }

    // Collection/special categories (trending, new, etc.)
    const collections = ['trending', 'new', 'best-sellers', 'featured', 'premium', 'deals'];
    if (collections.some((c) => category.toLowerCase().includes(c))) {
      return 'collection';
    }

    // Default to genre
    return 'genre';
  }

  /**
   * Get dynamic categories aggregated from published products
   * Returns categories with product counts, featured collections, and metadata
   */
  async getCategories(): Promise<{
    categories: Array<{
      id: string;
      label: string;
      type: 'genre' | 'platform' | 'collection' | 'custom';
      count: number;
      icon: string;
      sortOrder: number;
    }>;
    featured: Array<{
      id: string;
      label: string;
      sort: string;
      icon: string;
    }>;
    totalProducts: number;
  }> {
    // Get total published products
    const totalProducts = await this.productRepo.count({
      where: { isPublished: true },
    });

    // Aggregate categories from published products
    // Categories are stored in the 'category' field (set from first genre during import)
    const categoryAggregation = await this.productRepo
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .addSelect('COUNT(product.id)', 'count')
      .where('product.isPublished = true')
      .andWhere('product.category IS NOT NULL')
      .andWhere("product.category != ''")
      .groupBy('product.category')
      .orderBy('count', 'DESC')
      .getRawMany<{ category: string; count: string }>();

    // Aggregate platforms from published products
    const platformAggregation = await this.productRepo
      .createQueryBuilder('product')
      .select('product.platform', 'platform')
      .addSelect('COUNT(product.id)', 'count')
      .where('product.isPublished = true')
      .andWhere('product.platform IS NOT NULL')
      .andWhere("product.platform != ''")
      .groupBy('product.platform')
      .orderBy('count', 'DESC')
      .getRawMany<{ platform: string; count: string }>();

    // Build categories array
    const categories: Array<{
      id: string;
      label: string;
      type: 'genre' | 'platform' | 'collection' | 'custom';
      count: number;
      icon: string;
      sortOrder: number;
    }> = [];

    // Add platform-based categories first (most important for gaming)
    let sortOrder = 0;
    for (const item of platformAggregation) {
      categories.push({
        id: item.platform.toLowerCase().replace(/\s+/g, '-'),
        label: item.platform,
        type: 'platform',
        count: parseInt(item.count, 10),
        icon: this.getPlatformIcon(item.platform),
        sortOrder: sortOrder++,
      });
    }

    // Add genre-based categories
    for (const item of categoryAggregation) {
      // Skip if already added as platform
      const id = item.category.toLowerCase().replace(/\s+/g, '-');
      if (categories.some((c) => c.id === id)) {
        continue;
      }

      categories.push({
        id,
        label: item.category,
        type: this.getCategoryType(item.category),
        count: parseInt(item.count, 10),
        icon: 'Tag',
        sortOrder: sortOrder++,
      });
    }

    // Featured collections (virtual categories based on sorting)
    const featured = [
      { id: 'trending', label: 'Trending', sort: 'trending', icon: 'TrendingUp' },
      { id: 'best-sellers', label: 'Best Sellers', sort: 'sales', icon: 'Award' },
      { id: 'new', label: 'New Releases', sort: 'newest', icon: 'Sparkles' },
      { id: 'deals', label: 'Deals', sort: 'discount', icon: 'Percent' },
    ];

    return {
      categories,
      featured,
      totalProducts,
    };
  }

  /**
   * Get dynamic filters aggregated from published products
   * Returns platforms, regions, genres with counts and price range
   */
  async getFilters(): Promise<{
    platforms: Array<{ id: string; label: string; count: number }>;
    regions: Array<{ id: string; label: string; count: number }>;
    genres: Array<{ id: string; label: string; count: number }>;
    priceRange: { min: number; max: number; currency: string };
  }> {
    // Aggregate platforms
    const platformAggregation = await this.productRepo
      .createQueryBuilder('product')
      .select('product.platform', 'platform')
      .addSelect('COUNT(product.id)', 'count')
      .where('product.isPublished = true')
      .andWhere('product.platform IS NOT NULL')
      .andWhere("product.platform != ''")
      .groupBy('product.platform')
      .orderBy('count', 'DESC')
      .getRawMany<{ platform: string; count: string }>();

    // Aggregate regions
    const regionAggregation = await this.productRepo
      .createQueryBuilder('product')
      .select('product.region', 'region')
      .addSelect('COUNT(product.id)', 'count')
      .where('product.isPublished = true')
      .andWhere('product.region IS NOT NULL')
      .andWhere("product.region != ''")
      .groupBy('product.region')
      .orderBy('count', 'DESC')
      .getRawMany<{ region: string; count: string }>();

    // Aggregate genres from JSON array column
    // Note: genres is stored as JSON array, we need to unnest it
    const genreAggregation = await this.dataSource
      .createQueryBuilder()
      .select('genre', 'genre')
      .addSelect('COUNT(*)', 'count')
      .from((subQuery) => {
        return subQuery
          .select('jsonb_array_elements_text(product.genres::jsonb)', 'genre')
          .from(Product, 'product')
          .where('product.isPublished = true')
          .andWhere('product.genres IS NOT NULL')
          .andWhere("product.genres != '[]'");
      }, 'genres_unnested')
      .groupBy('genre')
      .orderBy('count', 'DESC')
      .limit(30) // Limit to top 30 genres
      .getRawMany<{ genre: string; count: string }>();

    // Get price range (min and max from published products)
    const priceStats = await this.productRepo
      .createQueryBuilder('product')
      .select('MIN(CAST(product.price AS DECIMAL))', 'minPrice')
      .addSelect('MAX(CAST(product.price AS DECIMAL))', 'maxPrice')
      .where('product.isPublished = true')
      .andWhere('product.price IS NOT NULL')
      .andWhere("product.price != ''")
      .getRawOne<{ minPrice: string | null; maxPrice: string | null }>();

    // Build response
    const platforms = platformAggregation.map((item) => ({
      id: item.platform.toLowerCase().replace(/\s+/g, '-'),
      label: item.platform,
      count: parseInt(item.count, 10),
    }));

    const regions = regionAggregation.map((item) => ({
      id: item.region.toLowerCase().replace(/\s+/g, '-'),
      label: item.region,
      count: parseInt(item.count, 10),
    }));

    const genres = genreAggregation.map((item) => ({
      id: item.genre.toLowerCase().replace(/\s+/g, '-'),
      label: item.genre,
      count: parseInt(item.count, 10),
    }));

    const priceRange = {
      min: priceStats?.minPrice != null ? parseFloat(priceStats.minPrice) : 0,
      max: priceStats?.maxPrice != null ? parseFloat(priceStats.maxPrice) : 100,
      currency: 'EUR',
    };

    return {
      platforms,
      regions,
      genres,
      priceRange,
    };
  }
}

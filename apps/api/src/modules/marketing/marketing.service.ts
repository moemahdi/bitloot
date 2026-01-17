import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { FlashDeal, FlashDealProduct, BundleDeal, BundleProduct } from './entities';
import { Product } from '../catalog/entities/product.entity';
import {
  CreateFlashDealDto,
  UpdateFlashDealDto,
  CreateBundleDealDto,
  UpdateBundleDealDto,
  FlashDealResponseDto,
  BundleDealResponseDto,
} from './dto';

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(FlashDeal)
    private readonly flashDealRepo: Repository<FlashDeal>,
    @InjectRepository(FlashDealProduct)
    private readonly flashDealProductRepo: Repository<FlashDealProduct>,
    @InjectRepository(BundleDeal)
    private readonly bundleDealRepo: Repository<BundleDeal>,
    @InjectRepository(BundleProduct)
    private readonly bundleProductRepo: Repository<BundleProduct>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) { }

  // ============================================================================
  // FLASH DEALS
  // ============================================================================

  async getAllFlashDeals(): Promise<FlashDeal[]> {
    return this.flashDealRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      relations: ['products', 'products.product'],
    });
  }

  async getFlashDealById(id: string): Promise<FlashDeal> {
    const deal = await this.flashDealRepo.findOne({
      where: { id },
      relations: ['products', 'products.product'],
    });
    if (deal === null || deal === undefined) {
      throw new NotFoundException(`Flash deal ${id} not found`);
    }
    return deal;
  }

  async getActiveFlashDeal(): Promise<FlashDeal | null> {
    const now = new Date();
    return this.flashDealRepo.findOne({
      where: {
        isActive: true,
        startsAt: LessThanOrEqual(now),
        endsAt: MoreThanOrEqual(now),
      },
      relations: ['products', 'products.product'],
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Get active flash deal by display type
   * Allows having one inline and one sticky flash deal active simultaneously
   */
  async getActiveFlashDealByType(displayType: 'inline' | 'sticky'): Promise<FlashDeal | null> {
    const now = new Date();
    return this.flashDealRepo.findOne({
      where: {
        isActive: true,
        displayType,
        startsAt: LessThanOrEqual(now),
        endsAt: MoreThanOrEqual(now),
      },
      relations: ['products', 'products.product'],
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Get all active flash deals (both inline and sticky)
   */
  async getActiveFlashDeals(): Promise<FlashDeal[]> {
    const now = new Date();
    return this.flashDealRepo.find({
      where: {
        isActive: true,
        startsAt: LessThanOrEqual(now),
        endsAt: MoreThanOrEqual(now),
      },
      relations: ['products', 'products.product'],
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Get effective price for a product considering flash deals
   * Returns { effectivePrice, originalPrice, discountPercent, currency, isDiscounted }
   * 
   * This is the SOURCE OF TRUTH for product pricing - use this everywhere:
   * - Product display pages
   * - Cart calculations
   * - Order creation
   * - Checkout totals
   */
  async getEffectivePrice(
    productId: string,
    productPrice: string,
    productCurrency: string = 'EUR',
  ): Promise<{
    effectivePrice: string;
    originalPrice: string;
    discountPercent: number;
    currency: string;
    isDiscounted: boolean;
    flashDealId?: string;
  }> {
    // Check if product is in an active flash deal
    const activeFlashDeal = await this.getActiveFlashDeal();

    if (activeFlashDeal !== null && activeFlashDeal !== undefined) {
      const flashDealProduct = activeFlashDeal.products?.find(
        (p) => p.productId === productId,
      );

      if (flashDealProduct !== null && flashDealProduct !== undefined) {
        // Product is in a flash deal - calculate discounted price
        const originalPrice = flashDealProduct.originalPrice !== null && flashDealProduct.originalPrice !== undefined && flashDealProduct.originalPrice !== '' ? flashDealProduct.originalPrice : productPrice;
        const discountPercent = parseFloat(flashDealProduct.discountPercent ?? '0');

        // Use pre-calculated discountPrice if available, otherwise calculate
        let effectivePrice: string;
        if (flashDealProduct.discountPrice !== null && flashDealProduct.discountPrice !== undefined && flashDealProduct.discountPrice !== '') {
          effectivePrice = flashDealProduct.discountPrice;
        } else {
          const originalPriceNum = parseFloat(originalPrice);
          const discountedPriceNum = originalPriceNum * (1 - discountPercent / 100);
          effectivePrice = discountedPriceNum.toFixed(8);
        }

        return {
          effectivePrice,
          originalPrice,
          discountPercent,
          currency: productCurrency,
          isDiscounted: true,
          flashDealId: activeFlashDeal.id,
        };
      }
    }

    // No flash deal discount - return original price
    return {
      effectivePrice: productPrice,
      originalPrice: productPrice,
      discountPercent: 0,
      currency: productCurrency,
      isDiscounted: false,
    };
  }

  /**
   * Get effective prices for multiple products at once (batch operation)
   * Returns a map of productId → pricing info
   */
  async getEffectivePricesForProducts(
    products: Array<{ id: string; price: string; currency?: string }>,
  ): Promise<Map<string, {
    effectivePrice: string;
    originalPrice: string;
    discountPercent: number;
    currency: string;
    isDiscounted: boolean;
    flashDealId?: string;
  }>> {
    const result = new Map<string, {
      effectivePrice: string;
      originalPrice: string;
      discountPercent: number;
      currency: string;
      isDiscounted: boolean;
      flashDealId?: string;
    }>();

    // Get active flash deal once
    const activeFlashDeal = await this.getActiveFlashDeal();

    // Create a map of flash deal products for O(1) lookup
    const flashDealProductsMap = new Map<string, FlashDealProduct>();
    if (activeFlashDeal?.products !== null && activeFlashDeal?.products !== undefined) {
      for (const fdp of activeFlashDeal.products) {
        flashDealProductsMap.set(fdp.productId, fdp);
      }
    }

    // Calculate effective price for each product
    for (const product of products) {
      const flashDealProduct = flashDealProductsMap.get(product.id);

      if (flashDealProduct !== null && flashDealProduct !== undefined) {
        const originalPrice = flashDealProduct.originalPrice !== null && flashDealProduct.originalPrice !== undefined && flashDealProduct.originalPrice !== '' ? flashDealProduct.originalPrice : product.price;
        const discountPercent = parseFloat(flashDealProduct.discountPercent ?? '0');

        let effectivePrice: string;
        if (flashDealProduct.discountPrice !== null && flashDealProduct.discountPrice !== undefined && flashDealProduct.discountPrice !== '') {
          effectivePrice = flashDealProduct.discountPrice;
        } else {
          const originalPriceNum = parseFloat(originalPrice);
          const discountedPriceNum = originalPriceNum * (1 - discountPercent / 100);
          effectivePrice = discountedPriceNum.toFixed(8);
        }

        result.set(product.id, {
          effectivePrice,
          originalPrice,
          discountPercent,
          currency: product.currency ?? 'EUR',
          isDiscounted: true,
          flashDealId: activeFlashDeal?.id,
        });
      } else {
        result.set(product.id, {
          effectivePrice: product.price,
          originalPrice: product.price,
          discountPercent: 0,
          currency: product.currency ?? 'EUR',
          isDiscounted: false,
        });
      }
    }

    return result;
  }

  async createFlashDeal(dto: CreateFlashDealDto, userId?: string): Promise<FlashDeal> {
    const slug = dto.slug ?? this.generateSlug(dto.name);

    // Check for duplicate slug
    const existing = await this.flashDealRepo.findOne({ where: { slug } });
    if (existing !== null && existing !== undefined) {
      throw new ConflictException(`Flash deal with slug ${slug} already exists`);
    }

    const deal = this.flashDealRepo.create({
      name: dto.name,
      slug,
      headline: dto.headline,
      subHeadline: dto.subHeadline,
      description: dto.description,
      isActive: dto.isActive ?? false,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
      backgroundType: dto.backgroundType ?? 'gradient',
      backgroundValue: dto.backgroundValue,
      accentColor: dto.accentColor ?? '#00D9FF',
      textColor: dto.textColor ?? '#FFFFFF',
      badgeText: dto.badgeText,
      badgeColor: dto.badgeColor,
      ctaText: dto.ctaText ?? 'Shop Now',
      ctaLink: dto.ctaLink,
      showCountdown: dto.showCountdown ?? true,
      showProducts: dto.showProducts ?? true,
      productsCount: dto.productsCount ?? 8,
      displayType: dto.displayType ?? 'inline',
      createdById: userId,
    });

    const savedDeal = await this.flashDealRepo.save(deal);

    // Add products if provided
    if (dto.products !== null && dto.products !== undefined && dto.products.length > 0) {
      const dealProducts = dto.products.map((p, index) =>
        this.flashDealProductRepo.create({
          flashDealId: savedDeal.id,
          productId: p.productId,
          discountPercent: p.discountPercent?.toString(),
          discountPrice: p.discountPrice,
          displayOrder: p.displayOrder ?? index,
          isFeatured: p.isFeatured ?? false,
          stockLimit: p.stockLimit,
        }),
      );
      await this.flashDealProductRepo.save(dealProducts);
    }

    return this.getFlashDealById(savedDeal.id);
  }

  async updateFlashDeal(id: string, dto: UpdateFlashDealDto): Promise<FlashDeal> {
    const deal = await this.getFlashDealById(id);

    // Update fields
    if (dto.name !== undefined) deal.name = dto.name;
    if (dto.slug !== undefined) deal.slug = dto.slug;
    if (dto.headline !== undefined) deal.headline = dto.headline;
    if (dto.subHeadline !== undefined) deal.subHeadline = dto.subHeadline;
    if (dto.description !== undefined) deal.description = dto.description;
    if (dto.isActive !== undefined) deal.isActive = dto.isActive;
    if (dto.startsAt !== undefined) deal.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) deal.endsAt = new Date(dto.endsAt);
    if (dto.backgroundType !== undefined) deal.backgroundType = dto.backgroundType;
    if (dto.backgroundValue !== undefined) deal.backgroundValue = dto.backgroundValue;
    if (dto.accentColor !== undefined) deal.accentColor = dto.accentColor;
    if (dto.textColor !== undefined) deal.textColor = dto.textColor;
    if (dto.badgeText !== undefined) deal.badgeText = dto.badgeText;
    if (dto.badgeColor !== undefined) deal.badgeColor = dto.badgeColor;
    if (dto.ctaText !== undefined) deal.ctaText = dto.ctaText;
    if (dto.ctaLink !== undefined) deal.ctaLink = dto.ctaLink;
    if (dto.showCountdown !== undefined) deal.showCountdown = dto.showCountdown;
    if (dto.showProducts !== undefined) deal.showProducts = dto.showProducts;
    if (dto.productsCount !== undefined) deal.productsCount = dto.productsCount;
    if (dto.displayType !== undefined) deal.displayType = dto.displayType;

    await this.flashDealRepo.save(deal);

    // Update products if provided
    if (dto.products !== undefined) {
      await this.flashDealProductRepo.delete({ flashDealId: id });
      if (dto.products.length > 0) {
        const dealProducts = dto.products.map((p, index) =>
          this.flashDealProductRepo.create({
            flashDealId: id,
            productId: p.productId,
            discountPercent: p.discountPercent?.toString(),
            discountPrice: p.discountPrice,
            displayOrder: p.displayOrder ?? index,
            isFeatured: p.isFeatured ?? false,
            stockLimit: p.stockLimit,
          }),
        );
        await this.flashDealProductRepo.save(dealProducts);
      }
    }

    return this.getFlashDealById(id);
  }

  async deleteFlashDeal(id: string): Promise<void> {
    const deal = await this.getFlashDealById(id);
    await this.flashDealRepo.remove(deal);
  }

  async activateFlashDeal(id: string): Promise<FlashDeal> {
    // First verify the deal exists
    const deal = await this.getFlashDealById(id);

    // Deactivate only other deals of the SAME displayType
    // This allows having one inline and one sticky flash deal active simultaneously
    await this.flashDealRepo
      .createQueryBuilder()
      .update(FlashDeal)
      .set({ isActive: false })
      .where('is_active = :isActive AND display_type = :displayType', {
        isActive: true,
        displayType: deal.displayType
      })
      .execute();

    // Activate the selected deal
    await this.flashDealRepo.update({ id }, { isActive: true });
    return this.getFlashDealById(id);
  }

  // ============================================================================
  // FLASH DEAL PRODUCTS
  // ============================================================================

  async addProductToFlashDeal(
    flashDealId: string,
    productId: string,
    discountPercent?: number,
    discountPrice?: string,
  ): Promise<FlashDeal> {
    // Verify flash deal exists
    const _deal = await this.getFlashDealById(flashDealId);

    // Check if product already in deal
    const existing = await this.flashDealProductRepo.findOne({
      where: { flashDealId, productId },
    });
    if (existing !== null && existing !== undefined) {
      throw new ConflictException('Product already in this flash deal');
    }

    // Fetch the product to get its current price
    const product = await this.flashDealProductRepo.manager.findOne(
      'Product',
      { where: { id: productId } },
    ) as { id: string; price: string } | null;
    if (product === null || product === undefined) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    // Get the next display order
    const maxOrder = await this.flashDealProductRepo
      .createQueryBuilder('fdp')
      .select('MAX(fdp.display_order)', 'max')
      .where('fdp.flash_deal_id = :flashDealId', { flashDealId })
      .getRawOne<{ max: number | null }>();
    const displayOrder = (maxOrder?.max ?? -1) + 1;

    // Calculate discounted price if discount percent is provided
    let calculatedDiscountPrice = discountPrice;
    if ((calculatedDiscountPrice === null || calculatedDiscountPrice === undefined || calculatedDiscountPrice === '') && (discountPercent !== null && discountPercent !== undefined && discountPercent !== 0) && product.price !== '') {
      const originalPriceNum = parseFloat(product.price);
      const discountedPriceNum = originalPriceNum * (1 - discountPercent / 100);
      calculatedDiscountPrice = discountedPriceNum.toFixed(8);
    }

    // Create the flash deal product with original price captured
    const flashDealProduct = this.flashDealProductRepo.create({
      flashDealId,
      productId,
      originalPrice: product.price, // Capture current product price
      discountPercent: discountPercent?.toString(),
      discountPrice: calculatedDiscountPrice,
      displayOrder,
    });
    await this.flashDealProductRepo.save(flashDealProduct);

    return this.getFlashDealById(flashDealId);
  }

  async removeProductFromFlashDeal(flashDealId: string, productId: string): Promise<FlashDeal> {
    // Verify flash deal exists
    await this.getFlashDealById(flashDealId);

    await this.flashDealProductRepo.delete({ flashDealId, productId });
    return this.getFlashDealById(flashDealId);
  }

  async updateFlashDealProduct(
    flashDealId: string,
    productId: string,
    discountPercent?: number,
    discountPrice?: string,
  ): Promise<FlashDeal> {
    const flashDealProduct = await this.flashDealProductRepo.findOne({
      where: { flashDealId, productId },
    });
    if (flashDealProduct === null || flashDealProduct === undefined) {
      throw new NotFoundException('Product not found in this flash deal');
    }

    if (discountPercent !== undefined) {
      flashDealProduct.discountPercent = discountPercent.toString();
    }
    if (discountPrice !== undefined) {
      flashDealProduct.discountPrice = discountPrice;
    }
    await this.flashDealProductRepo.save(flashDealProduct);

    return this.getFlashDealById(flashDealId);
  }

  // ============================================================================
  // BUNDLE DEALS
  // ============================================================================

  async getAllBundles(): Promise<BundleDeal[]> {
    return this.bundleDealRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      relations: ['products', 'products.product'],
    });
  }

  async getBundleById(id: string): Promise<BundleDeal> {
    const bundle = await this.bundleDealRepo.findOne({
      where: { id },
      relations: ['products', 'products.product'],
    });
    if (bundle === null || bundle === undefined) {
      throw new NotFoundException(`Bundle ${id} not found`);
    }
    return bundle;
  }

  async getActiveBundles(limit: number = 6): Promise<BundleDeal[]> {
    return this.bundleDealRepo.find({
      where: {
        isActive: true,
      },
      relations: ['products', 'products.product'],
      order: { isFeatured: 'DESC', displayOrder: 'ASC' },
      take: limit,
    });
  }

  async createBundle(dto: CreateBundleDealDto, userId?: string): Promise<BundleDeal> {
    const slug = dto.slug ?? this.generateSlug(dto.name);

    // Check for duplicate slug
    const existing = await this.bundleDealRepo.findOne({ where: { slug } });
    if (existing !== null && existing !== undefined) {
      throw new ConflictException(`Bundle with slug ${slug} already exists`);
    }

    // Use provided originalPrice and savingsPercent, or calculate later
    const originalPrice: string | undefined = dto.originalPrice;
    let savingsAmount: string | undefined;
    let savingsPercent: string | undefined = dto.savingsPercent?.toString();
    const productTypes: string[] = [];

    // Calculate savings amount if originalPrice is provided
    if (originalPrice !== null && originalPrice !== undefined && originalPrice !== '' && dto.bundlePrice !== null && dto.bundlePrice !== undefined && dto.bundlePrice !== '') {
      const original = parseFloat(originalPrice);
      const bundle = parseFloat(dto.bundlePrice);
      if (original > bundle) {
        savingsAmount = (original - bundle).toFixed(2);
        if (savingsPercent === null || savingsPercent === undefined || savingsPercent === '') {
          savingsPercent = (((original - bundle) / original) * 100).toFixed(2);
        }
      }
    }

    const bundle = this.bundleDealRepo.create({
      name: dto.name,
      slug,
      description: dto.description,
      shortDescription: dto.shortDescription,
      bundlePrice: dto.bundlePrice,
      originalPrice,
      savingsAmount,
      savingsPercent,
      currency: dto.currency ?? 'USD',
      isActive: dto.isActive ?? true,
      isFeatured: dto.isFeatured ?? false,
      startsAt: dto.startsAt !== null && dto.startsAt !== undefined && dto.startsAt !== '' ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt !== null && dto.endsAt !== undefined && dto.endsAt !== '' ? new Date(dto.endsAt) : undefined,
      coverImage: dto.coverImage,
      heroImage: dto.heroImage,
      category: dto.category,
      badgeText: dto.badgeText,
      badgeColor: dto.badgeColor,
      backgroundGradient: dto.backgroundGradient,
      stockLimit: dto.stockLimit,
      productTypes,
      createdById: userId,
    });

    const savedBundle = await this.bundleDealRepo.save(bundle);

    // Add products if provided
    if (dto.products !== null && dto.products !== undefined && dto.products.length > 0) {
      const bundleProducts = dto.products.map((p, index) =>
        this.bundleProductRepo.create({
          bundleId: savedBundle.id,
          productId: p.productId,
          displayOrder: p.displayOrder ?? index,
          isBonus: p.isBonus ?? false,
        }),
      );
      await this.bundleProductRepo.save(bundleProducts);
    }

    return this.getBundleById(savedBundle.id);
  }

  async updateBundle(id: string, dto: UpdateBundleDealDto): Promise<BundleDeal> {
    const bundle = await this.getBundleById(id);

    // Update fields
    if (dto.name !== undefined) bundle.name = dto.name;
    if (dto.slug !== undefined) bundle.slug = dto.slug;
    if (dto.description !== undefined) bundle.description = dto.description;
    if (dto.shortDescription !== undefined) bundle.shortDescription = dto.shortDescription;
    if (dto.bundlePrice !== undefined) bundle.bundlePrice = dto.bundlePrice;
    if (dto.originalPrice !== undefined) bundle.originalPrice = dto.originalPrice;
    if (dto.savingsPercent !== undefined) bundle.savingsPercent = dto.savingsPercent.toString();
    if (dto.category !== undefined) bundle.category = dto.category;
    if (dto.currency !== undefined) bundle.currency = dto.currency;
    if (dto.isActive !== undefined) bundle.isActive = dto.isActive;
    if (dto.isFeatured !== undefined) bundle.isFeatured = dto.isFeatured;
    if (dto.startsAt !== undefined) bundle.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) bundle.endsAt = new Date(dto.endsAt);
    if (dto.coverImage !== undefined) bundle.coverImage = dto.coverImage;
    if (dto.heroImage !== undefined) bundle.heroImage = dto.heroImage;
    if (dto.badgeText !== undefined) bundle.badgeText = dto.badgeText;
    if (dto.badgeColor !== undefined) bundle.badgeColor = dto.badgeColor;
    if (dto.backgroundGradient !== undefined) bundle.backgroundGradient = dto.backgroundGradient;
    if (dto.stockLimit !== undefined) bundle.stockLimit = dto.stockLimit;

    // Recalculate savings amount if originalPrice or bundlePrice changed
    if (bundle.originalPrice !== null && bundle.originalPrice !== undefined && bundle.originalPrice !== '' && bundle.bundlePrice !== null && bundle.bundlePrice !== undefined && bundle.bundlePrice !== '') {
      const original = parseFloat(bundle.originalPrice);
      const bundlePrice = parseFloat(bundle.bundlePrice);
      if (original > bundlePrice) {
        bundle.savingsAmount = (original - bundlePrice).toFixed(2);
      }
    }

    await this.bundleDealRepo.save(bundle);

    // Update products if provided
    if (dto.products !== undefined) {
      await this.bundleProductRepo.delete({ bundleId: id });
      if (dto.products.length > 0) {
        const bundleProducts = dto.products.map((p, index) =>
          this.bundleProductRepo.create({
            bundleId: id,
            productId: p.productId,
            displayOrder: p.displayOrder ?? index,
            isBonus: p.isBonus ?? false,
          }),
        );
        await this.bundleProductRepo.save(bundleProducts);
      }
    }

    return this.getBundleById(id);
  }

  async deleteBundle(id: string): Promise<void> {
    const bundle = await this.getBundleById(id);
    await this.bundleDealRepo.remove(bundle);
  }

  /**
   * Recalculate bundle prices based on individual product discounts
   */
  async recalculateBundlePrices(bundleId: string): Promise<void> {
    const bundle = await this.bundleDealRepo.findOne({
      where: { id: bundleId },
      relations: ['products', 'products.product'],
    });
    if (bundle?.products === undefined || bundle.products === null) return;

    let originalTotal = 0;
    let discountedTotal = 0;

    for (const bp of bundle.products) {
      if (bp.product !== null && bp.product !== undefined) {
        const rawProductPrice = parseFloat(bp.product.price);
        const productPrice = Number.isNaN(rawProductPrice) ? 0 : rawProductPrice;
        originalTotal += productPrice;

        if (bp.isBonus) {
          // Bonus items are free
          discountedTotal += 0;
        } else {
          const rawDiscountPct = parseFloat(bp.discountPercent);
          const discountPct = Number.isNaN(rawDiscountPct) ? 0 : rawDiscountPct;
          const discountedPrice = productPrice * (1 - discountPct / 100);
          discountedTotal += discountedPrice;
        }
      }
    }

    // Update bundle with calculated prices
    bundle.originalPrice = originalTotal.toFixed(2);
    bundle.bundlePrice = discountedTotal.toFixed(2);
    const savings = originalTotal - discountedTotal;
    bundle.savingsAmount = savings.toFixed(2);
    bundle.savingsPercent = originalTotal > 0
      ? ((savings / originalTotal) * 100).toFixed(2)
      : '0';

    await this.bundleDealRepo.save(bundle);
  }

  async addProductToBundle(
    bundleId: string,
    productId: string,
    discountPercent: number,
    displayOrder?: number,
    isBonus?: boolean,
  ): Promise<BundleDeal> {
    // Verify bundle exists
    await this.getBundleById(bundleId);

    // Check if product is already in bundle
    const existing = await this.bundleProductRepo.findOne({
      where: { bundleId, productId },
    });
    if (existing !== null && existing !== undefined) {
      throw new ConflictException('Product is already in this bundle');
    }

    // Verify product exists
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (product === null || product === undefined) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    // Get the next display order
    const maxOrder = await this.bundleProductRepo
      .createQueryBuilder('bp')
      .select('MAX(bp.display_order)', 'max')
      .where('bp.bundle_id = :bundleId', { bundleId })
      .getRawOne<{ max: number | null }>();
    const nextDisplayOrder = displayOrder ?? ((maxOrder?.max ?? -1) + 1);

    // Create the bundle product with discount
    const bundleProduct = this.bundleProductRepo.create({
      bundleId,
      productId,
      displayOrder: nextDisplayOrder,
      isBonus: isBonus === true,
      discountPercent: isBonus === true ? '100' : discountPercent.toString(),
    });
    await this.bundleProductRepo.save(bundleProduct);

    // Recalculate bundle prices
    await this.recalculateBundlePrices(bundleId);

    return this.getBundleById(bundleId);
  }

  async removeProductFromBundle(bundleId: string, productId: string): Promise<BundleDeal> {
    // Verify bundle exists
    await this.getBundleById(bundleId);

    await this.bundleProductRepo.delete({ bundleId, productId });

    // Recalculate bundle prices
    await this.recalculateBundlePrices(bundleId);

    return this.getBundleById(bundleId);
  }

  async updateBundleProduct(
    bundleId: string,
    productId: string,
    discountPercent?: number,
    displayOrder?: number,
    isBonus?: boolean,
  ): Promise<BundleDeal> {
    const bundleProduct = await this.bundleProductRepo.findOne({
      where: { bundleId, productId },
    });
    if (bundleProduct === null || bundleProduct === undefined) {
      throw new NotFoundException('Product not found in this bundle');
    }

    if (discountPercent !== undefined) {
      bundleProduct.discountPercent = discountPercent.toString();
    }
    if (displayOrder !== undefined) {
      bundleProduct.displayOrder = displayOrder;
    }
    if (isBonus !== undefined) {
      bundleProduct.isBonus = isBonus;
      if (isBonus) {
        bundleProduct.discountPercent = '100'; // Bonus items are free
      }
    }
    await this.bundleProductRepo.save(bundleProduct);

    // Recalculate bundle prices
    await this.recalculateBundlePrices(bundleId);

    return this.getBundleById(bundleId);
  }

  // ============================================================================
  // PUBLIC PAGE CONFIG
  // ============================================================================



  // ============================================================================
  // HELPERS
  // ============================================================================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private mapFlashDealToResponse(deal: FlashDeal): FlashDealResponseDto {
    return {
      id: deal.id,
      name: deal.name,
      slug: deal.slug,
      headline: deal.headline,
      subHeadline: deal.subHeadline,
      isActive: deal.isActive,
      startsAt: deal.startsAt,
      endsAt: deal.endsAt,
      backgroundType: deal.backgroundType,
      backgroundValue: deal.backgroundValue,
      accentColor: deal.accentColor,
      textColor: deal.textColor,
      badgeText: deal.badgeText,
      badgeColor: deal.badgeColor,
      ctaText: deal.ctaText,
      ctaLink: deal.ctaLink,
      showCountdown: deal.showCountdown,
      showProducts: deal.showProducts,
      productsCount: deal.productsCount,
      displayOrder: deal.displayOrder,
      displayType: deal.displayType ?? 'inline',
      products: deal.products?.map((p) => ({
        id: p.id,
        productId: p.productId,
        discountPercent: p.discountPercent,
        discountPrice: p.discountPrice,
        originalPrice: p.originalPrice,
        displayOrder: p.displayOrder,
        isFeatured: p.isFeatured,
        stockLimit: p.stockLimit,
        soldCount: p.soldCount,
        product: p.product !== null && p.product !== undefined
          ? {
            id: p.product.id,
            title: p.product.title,
            slug: p.product.slug,
            price: p.product.price,
            currency: p.product.currency,
            imageUrl: p.product.coverImageUrl,
            platform: p.product.platform,
            productType: p.product.category,
          }
          : undefined,
      })),
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    };
  }

  private mapBundleToResponse(bundle: BundleDeal): BundleDealResponseDto {
    return {
      id: bundle.id,
      name: bundle.name,
      slug: bundle.slug,
      description: bundle.description,
      shortDescription: bundle.shortDescription,
      bundlePrice: bundle.bundlePrice,
      originalPrice: bundle.originalPrice,
      savingsAmount: bundle.savingsAmount,
      savingsPercent: bundle.savingsPercent,
      currency: bundle.currency,
      isActive: bundle.isActive,
      isFeatured: bundle.isFeatured,
      startsAt: bundle.startsAt,
      endsAt: bundle.endsAt,
      coverImage: bundle.coverImage,
      badgeText: bundle.badgeText,
      badgeColor: bundle.badgeColor,
      backgroundGradient: bundle.backgroundGradient,
      displayOrder: bundle.displayOrder,
      stockLimit: bundle.stockLimit,
      soldCount: bundle.soldCount,
      productTypes: bundle.productTypes,
      products: bundle.products?.map((p) => ({
        id: p.id,
        productId: p.productId,
        discountPercent: p.discountPercent ?? '0',
        displayOrder: p.displayOrder,
        isBonus: p.isBonus,
        product: p.product !== null && p.product !== undefined
          ? {
            id: p.product.id,
            title: p.product.title,
            slug: p.product.slug,
            price: p.product.price,
            currency: p.product.currency,
            imageUrl: p.product.coverImageUrl,
            platform: p.product.platform,
            productType: p.product.category,
          }
          : undefined,
      })),
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt,
    };
  }
}

import { Injectable, NotFoundException, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { PromoCode } from './entities/promocode.entity';
import { PromoRedemption } from './entities/promoredemption.entity';
import {
    ValidatePromoDto,
    ValidatePromoResponseDto,
    CreatePromoCodeDto,
    UpdatePromoCodeDto,
    PromoCodeResponseDto,
    PromoRedemptionResponseDto,
} from './dto/promo.dto';

/**
 * Error codes for promo validation failures
 */
export enum PromoErrorCode {
    NOT_FOUND = 'PROMO_NOT_FOUND',
    INACTIVE = 'PROMO_INACTIVE',
    NOT_STARTED = 'PROMO_NOT_STARTED',
    EXPIRED = 'PROMO_EXPIRED',
    MAX_USES_REACHED = 'PROMO_MAX_USES_REACHED',
    USER_LIMIT_REACHED = 'PROMO_USER_LIMIT_REACHED',
    MIN_ORDER_NOT_MET = 'PROMO_MIN_ORDER_NOT_MET',
    SCOPE_MISMATCH = 'PROMO_SCOPE_MISMATCH',
    ALREADY_APPLIED = 'PROMO_ALREADY_APPLIED',
    NOT_STACKABLE = 'PROMO_NOT_STACKABLE',
}

@Injectable()
export class PromosService {
    private readonly logger = new Logger(PromosService.name);

    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(PromoCode) private readonly promoRepo: Repository<PromoCode>,
        @InjectRepository(PromoRedemption) private readonly redemptionRepo: Repository<PromoRedemption>,
    ) { }

    // ==================== VALIDATION ====================

    /**
     * Validate a promo code for checkout
     * Returns discount amount if valid, or error message if not
     */
    async validateCode(dto: ValidatePromoDto): Promise<ValidatePromoResponseDto> {
        const code = dto.code.toUpperCase().trim();
        const orderTotal = parseFloat(dto.orderTotal);

        if (isNaN(orderTotal) || orderTotal <= 0) {
            return {
                valid: false,
                message: 'Invalid order total',
                errorCode: 'INVALID_ORDER_TOTAL',
            };
        }

        // Find promo code (case-insensitive)
        const promo = await this.promoRepo.findOne({
            where: { code, deletedAt: undefined },
        });

        if (promo === null) {
            return {
                valid: false,
                message: 'Promo code not found',
                errorCode: PromoErrorCode.NOT_FOUND,
            };
        }

        // Check if active
        if (!promo.isActive) {
            return {
                valid: false,
                message: 'This promo code is no longer active',
                errorCode: PromoErrorCode.INACTIVE,
            };
        }

        // Check date range
        const now = new Date();
        if (promo.startsAt !== null && promo.startsAt !== undefined && promo.startsAt > now) {
            return {
                valid: false,
                message: 'This promo code is not yet active',
                errorCode: PromoErrorCode.NOT_STARTED,
            };
        }

        if (promo.expiresAt !== null && promo.expiresAt !== undefined && promo.expiresAt < now) {
            return {
                valid: false,
                message: 'This promo code has expired',
                errorCode: PromoErrorCode.EXPIRED,
            };
        }

        // Check max total uses
        if (promo.maxUsesTotal !== null && promo.maxUsesTotal !== undefined && promo.usageCount >= promo.maxUsesTotal) {
            return {
                valid: false,
                message: 'This promo code has reached its usage limit',
                errorCode: PromoErrorCode.MAX_USES_REACHED,
            };
        }

        // Check per-user limit
        if (promo.maxUsesPerUser !== null && promo.maxUsesPerUser !== undefined) {
            const userIdentifier = dto.userId ?? dto.email;
            if (userIdentifier !== undefined && userIdentifier !== null) {
                const userRedemptions = await this.countUserRedemptions(promo.id, dto.userId, dto.email);
                if (userRedemptions >= promo.maxUsesPerUser) {
                    return {
                        valid: false,
                        message: 'You have already used this promo code the maximum number of times',
                        errorCode: PromoErrorCode.USER_LIMIT_REACHED,
                    };
                }
            }
        }

        // Check minimum order value
        if (promo.minOrderValue !== null && promo.minOrderValue !== undefined) {
            const minOrder = parseFloat(promo.minOrderValue);
            if (orderTotal < minOrder) {
                return {
                    valid: false,
                    message: `Minimum order of €${minOrder.toFixed(2)} required for this promo`,
                    errorCode: PromoErrorCode.MIN_ORDER_NOT_MET,
                };
            }
        }

        // Check scope
        if (promo.scopeType !== 'global') {
            const scopeValid = this.checkScope(promo, dto.productIds, dto.categoryIds);
            if (!scopeValid) {
                return {
                    valid: false,
                    message: promo.scopeType === 'category'
                        ? 'This promo code only applies to specific categories'
                        : 'This promo code only applies to specific products',
                    errorCode: PromoErrorCode.SCOPE_MISMATCH,
                };
            }
        }

        // Check stacking rules
        if (dto.appliedPromoCodeIds !== undefined && dto.appliedPromoCodeIds.length > 0) {
            // If trying to apply same promo again
            if (dto.appliedPromoCodeIds.includes(promo.id)) {
                return {
                    valid: false,
                    message: 'This promo code is already applied',
                    errorCode: PromoErrorCode.ALREADY_APPLIED,
                };
            }

            // If new promo is not stackable
            if (!promo.stackable) {
                return {
                    valid: false,
                    message: 'This promo code cannot be combined with other discounts',
                    errorCode: PromoErrorCode.NOT_STACKABLE,
                };
            }

            // Check if any already-applied promo is non-stackable
            const appliedPromos = await this.promoRepo.findBy({ id: In(dto.appliedPromoCodeIds) });
            const nonStackable = appliedPromos.find(p => !p.stackable);
            if (nonStackable !== undefined) {
                return {
                    valid: false,
                    message: `Cannot stack with "${nonStackable.code}" - it doesn't allow combining discounts`,
                    errorCode: PromoErrorCode.NOT_STACKABLE,
                };
            }
        }

        // Calculate discount amount
        const discountAmount = this.calculateDiscount(promo, orderTotal);

        this.logger.log(`✅ Promo code ${code} validated: ${promo.discountType} ${promo.discountValue} = €${discountAmount.toFixed(2)} off`);

        return {
            valid: true,
            promoCodeId: promo.id,
            discountAmount: discountAmount.toFixed(8),
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            stackable: promo.stackable,
            message: promo.discountType === 'percent'
                ? `${promo.discountValue}% discount applied`
                : `€${parseFloat(promo.discountValue).toFixed(2)} discount applied`,
        };
    }

    /**
     * Count how many times a user has redeemed a specific promo
     */
    private async countUserRedemptions(promoCodeId: string, userId?: string, email?: string): Promise<number> {
        const query = this.redemptionRepo.createQueryBuilder('r')
            .where('r.promoCodeId = :promoCodeId', { promoCodeId });

        if (userId !== undefined && userId !== null) {
            query.andWhere('(r.userId = :userId OR r.email = :email)', { userId, email: email?.toLowerCase() });
        } else if (email !== undefined && email !== null) {
            query.andWhere('r.email = :email', { email: email.toLowerCase() });
        } else {
            return 0; // Can't check without identifier
        }

        return query.getCount();
    }

    /**
     * Check if the order items match the promo scope
     */
    private checkScope(promo: PromoCode, productIds?: string[], categoryIds?: string[]): boolean {
        if (promo.scopeValue === undefined || promo.scopeValue === null) {
            return false; // No scope value set for scoped promo
        }

        const scopeValues = promo.scopeValue.split(',').map(v => v.trim().toLowerCase());

        if (promo.scopeType === 'product') {
            if (productIds === undefined || productIds.length === 0) return false;
            return productIds.some(pid => scopeValues.includes(pid.toLowerCase()));
        }

        if (promo.scopeType === 'category') {
            if (categoryIds === undefined || categoryIds.length === 0) return false;
            return categoryIds.some(cid => scopeValues.includes(cid.toLowerCase()));
        }

        return false;
    }

    /**
     * Calculate actual discount amount, clamped to order total
     */
    private calculateDiscount(promo: PromoCode, orderTotal: number): number {
        let discount = 0;

        if (promo.discountType === 'percent') {
            const percent = parseFloat(promo.discountValue);
            discount = orderTotal * (percent / 100);
        } else {
            discount = parseFloat(promo.discountValue);
        }

        // Clamp discount to order total (never exceed)
        return Math.min(discount, orderTotal);
    }

    // ==================== REDEMPTION ====================

    /**
     * Record a promo code redemption (idempotent)
     * Called when payment is confirmed, not at checkout
     */
    async recordRedemption(data: {
        promoCodeId: string;
        orderId: string;
        userId?: string;
        email: string;
        discountApplied: string;
        originalTotal: string;
        finalTotal: string;
    }): Promise<PromoRedemption> {
        return this.dataSource.transaction(async (manager) => {
            // Check for existing redemption (idempotency)
            const existing = await manager.findOne(PromoRedemption, {
                where: { promoCodeId: data.promoCodeId, orderId: data.orderId },
            });

            if (existing !== null) {
                this.logger.debug(`⏭️ Promo redemption already exists for order ${data.orderId}`);
                return existing;
            }

            // Create redemption record
            const redemption = manager.create(PromoRedemption, {
                promoCodeId: data.promoCodeId,
                orderId: data.orderId,
                userId: data.userId,
                email: data.email.toLowerCase(),
                discountApplied: data.discountApplied,
                originalTotal: data.originalTotal,
                finalTotal: data.finalTotal,
            });

            const saved = await manager.save(redemption);

            // Increment usage count
            await manager.increment(PromoCode, { id: data.promoCodeId }, 'usageCount', 1);

            this.logger.log(`🎟️ Promo redemption recorded: order=${data.orderId}, discount=€${data.discountApplied}`);

            return saved;
        });
    }

    // ==================== ADMIN CRUD ====================

    async create(dto: CreatePromoCodeDto): Promise<PromoCode> {
        const code = dto.code.toUpperCase().trim();

        // Check for duplicate code
        const existing = await this.promoRepo.findOne({ where: { code } });
        if (existing !== null) {
            throw new ConflictException(`Promo code "${code}" already exists`);
        }

        // Validate percent discount range
        if (dto.discountType === 'percent') {
            const percent = parseFloat(dto.discountValue);
            if (isNaN(percent) || percent < 0 || percent > 100) {
                throw new BadRequestException('Percent discount must be between 0 and 100');
            }
        }

        const promo = this.promoRepo.create({
            code,
            description: dto.description,
            discountType: dto.discountType,
            discountValue: dto.discountValue,
            minOrderValue: dto.minOrderValue,
            maxUsesTotal: dto.maxUsesTotal,
            maxUsesPerUser: dto.maxUsesPerUser,
            scopeType: dto.scopeType ?? 'global',
            scopeValue: dto.scopeValue,
            startsAt: dto.startsAt !== undefined ? new Date(dto.startsAt) : undefined,
            expiresAt: dto.expiresAt !== undefined ? new Date(dto.expiresAt) : undefined,
            stackable: dto.stackable ?? false,
            isActive: dto.isActive ?? true,
        });

        const saved = await this.promoRepo.save(promo);
        this.logger.log(`🆕 Promo code created: ${code} (${dto.discountType} ${dto.discountValue})`);

        return saved;
    }

    async update(id: string, dto: UpdatePromoCodeDto): Promise<PromoCode> {
        const promo = await this.findOneOrThrow(id);

        // Validate percent discount range if updating
        if (dto.discountType === 'percent' || (dto.discountValue !== undefined && promo.discountType === 'percent')) {
            const percent = parseFloat(dto.discountValue ?? promo.discountValue);
            if (isNaN(percent) || percent < 0 || percent > 100) {
                throw new BadRequestException('Percent discount must be between 0 and 100');
            }
        }

        // Apply updates
        if (dto.description !== undefined) promo.description = dto.description;
        if (dto.discountType !== undefined) promo.discountType = dto.discountType;
        if (dto.discountValue !== undefined) promo.discountValue = dto.discountValue;
        if (dto.minOrderValue !== undefined) promo.minOrderValue = dto.minOrderValue;
        if (dto.maxUsesTotal !== undefined) promo.maxUsesTotal = dto.maxUsesTotal;
        if (dto.maxUsesPerUser !== undefined) promo.maxUsesPerUser = dto.maxUsesPerUser;
        if (dto.scopeType !== undefined) promo.scopeType = dto.scopeType;
        if (dto.scopeValue !== undefined) promo.scopeValue = dto.scopeValue;
        if (dto.startsAt !== undefined) promo.startsAt = new Date(dto.startsAt);
        if (dto.expiresAt !== undefined) promo.expiresAt = new Date(dto.expiresAt);
        if (dto.stackable !== undefined) promo.stackable = dto.stackable;
        if (dto.isActive !== undefined) promo.isActive = dto.isActive;

        const updated = await this.promoRepo.save(promo);
        this.logger.log(`📝 Promo code updated: ${promo.code}`);

        return updated;
    }

    async delete(id: string): Promise<void> {
        const promo = await this.findOneOrThrow(id);
        await this.promoRepo.delete(id);
        this.logger.log(`🗑️ Promo code deleted: ${promo.code}`);
    }

    async findOneOrThrow(id: string): Promise<PromoCode> {
        const promo = await this.promoRepo.findOne({ where: { id } });
        if (promo === null) {
            throw new NotFoundException(`Promo code with ID ${id} not found`);
        }
        return promo;
    }

    async findByCode(code: string): Promise<PromoCode | null> {
        return this.promoRepo.findOne({ where: { code: code.toUpperCase().trim() } });
    }

    async findAll(options: {
        page?: number;
        limit?: number;
        isActive?: boolean;
        search?: string;
        scopeType?: string;
    }): Promise<{ data: PromoCode[]; total: number }> {
        const page = options.page ?? 1;
        const limit = Math.min(options.limit ?? 20, 100);

        const query = this.promoRepo.createQueryBuilder('p')
            .where('p.deletedAt IS NULL');

        if (options.isActive !== undefined) {
            query.andWhere('p.isActive = :isActive', { isActive: options.isActive });
        }

        if (options.search !== undefined && options.search.length > 0) {
            query.andWhere('(p.code ILIKE :search OR p.description ILIKE :search)', {
                search: `%${options.search}%`,
            });
        }

        if (options.scopeType !== undefined) {
            query.andWhere('p.scopeType = :scopeType', { scopeType: options.scopeType });
        }

        query.orderBy('p.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [data, total] = await query.getManyAndCount();

        return { data, total };
    }

    async getRedemptions(promoCodeId: string, options: {
        page?: number;
        limit?: number;
    }): Promise<{ data: PromoRedemption[]; total: number }> {
        const page = options.page ?? 1;
        const limit = Math.min(options.limit ?? 20, 100);

        const [data, total] = await this.redemptionRepo.findAndCount({
            where: { promoCodeId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total };
    }

    // ==================== RESPONSE MAPPING ====================

    toResponseDto(promo: PromoCode): PromoCodeResponseDto {
        return {
            id: promo.id,
            code: promo.code,
            description: promo.description,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            minOrderValue: promo.minOrderValue,
            maxUsesTotal: promo.maxUsesTotal,
            maxUsesPerUser: promo.maxUsesPerUser,
            usageCount: promo.usageCount,
            scopeType: promo.scopeType,
            scopeValue: promo.scopeValue,
            startsAt: promo.startsAt?.toISOString(),
            expiresAt: promo.expiresAt?.toISOString(),
            stackable: promo.stackable,
            isActive: promo.isActive,
            createdAt: promo.createdAt.toISOString(),
            updatedAt: promo.updatedAt.toISOString(),
        };
    }

    toRedemptionResponseDto(redemption: PromoRedemption): PromoRedemptionResponseDto {
        return {
            id: redemption.id,
            promoCodeId: redemption.promoCodeId,
            orderId: redemption.orderId,
            userId: redemption.userId,
            email: redemption.email,
            discountApplied: redemption.discountApplied,
            originalTotal: redemption.originalTotal,
            finalTotal: redemption.finalTotal,
            createdAt: redemption.createdAt.toISOString(),
        };
    }
}

import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag } from '../../database/entities/feature-flag.entity';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  FeatureFlagResponseDto,
  ListFeatureFlagsResponseDto,
  ToggleFeatureFlagResponseDto,
  GroupedFeatureFlagsResponseDto,
} from './dto/feature-flag.dto';

/**
 * Feature Flags Service
 *
 * Manages runtime feature toggles with database persistence.
 * Replaces in-memory Map with TypeORM repository.
 *
 * Features:
 * - CRUD operations for feature flags
 * - Toggle flag by name
 * - Check if flag is enabled (for other services)
 * - Group flags by category
 * - Audit trail (updatedById)
 */
@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  // In-memory cache for hot path checks (refreshed on updates)
  private flagCache: Map<string, boolean> = new Map();
  private cacheInitialized = false;

  constructor(
    @InjectRepository(FeatureFlag)
    private readonly flagRepo: Repository<FeatureFlag>,
  ) {
    // Initialize cache on service startup
    void this.refreshCache();
  }

  /**
   * Refresh in-memory cache from database
   */
  private async refreshCache(): Promise<void> {
    try {
      const flags = await this.flagRepo.find();
      this.flagCache.clear();
      for (const flag of flags) {
        this.flagCache.set(flag.name, flag.enabled);
      }
      this.cacheInitialized = true;
      this.logger.log(`✅ Feature flag cache initialized with ${flags.length} flags`);
    } catch (error) {
      this.logger.error('Failed to initialize feature flag cache', error);
    }
  }

  /**
   * Check if a feature flag is enabled (fast path using cache)
   * Used by other services (FulfillmentService, CatalogService, etc.)
   */
  isEnabled(name: string): boolean {
    // Use cache for performance
    if (this.cacheInitialized) {
      return this.flagCache.get(name) ?? false;
    }
    // Fallback: return true to avoid blocking functionality during startup
    return true;
  }

  /**
   * Get all feature flags
   */
  async findAll(): Promise<ListFeatureFlagsResponseDto> {
    const flags = await this.flagRepo.find({
      order: { category: 'ASC', name: 'ASC' },
      relations: ['updatedBy'],
    });

    const flagDtos = flags.map((f) => this.toResponseDto(f));
    const enabledCount = flags.filter((f) => f.enabled).length;

    return {
      flags: flagDtos,
      total: flags.length,
      enabledCount,
      disabledCount: flags.length - enabledCount,
    };
  }

  /**
   * Get flags grouped by category
   */
  async findAllGrouped(): Promise<GroupedFeatureFlagsResponseDto> {
    const flags = await this.flagRepo.find({
      order: { category: 'ASC', name: 'ASC' },
      relations: ['updatedBy'],
    });

    const groups: Record<string, FeatureFlagResponseDto[]> = {};
    const categories = new Set<string>();

    for (const flag of flags) {
      const category = flag.category !== '' ? flag.category : 'system';
      categories.add(category);
      const categoryGroup = groups[category] ?? [];
      categoryGroup.push(this.toResponseDto(flag));
      groups[category] = categoryGroup;
    }

    return {
      groups,
      total: flags.length,
      categories: Array.from(categories).sort(),
    };
  }

  /**
   * Get a single feature flag by name
   */
  async findByName(name: string): Promise<FeatureFlagResponseDto> {
    const flag = await this.flagRepo.findOne({
      where: { name },
      relations: ['updatedBy'],
    });

    if (flag === null) {
      throw new NotFoundException(`Feature flag '${name}' not found`);
    }

    return this.toResponseDto(flag);
  }

  /**
   * Get a single feature flag by ID
   */
  async findById(id: string): Promise<FeatureFlagResponseDto> {
    const flag = await this.flagRepo.findOne({
      where: { id },
      relations: ['updatedBy'],
    });

    if (flag === null) {
      throw new NotFoundException(`Feature flag with ID '${id}' not found`);
    }

    return this.toResponseDto(flag);
  }

  /**
   * Create a new feature flag
   */
  async create(dto: CreateFeatureFlagDto, adminUserId?: string): Promise<FeatureFlagResponseDto> {
    // Check for duplicate name
    const existing = await this.flagRepo.findOne({ where: { name: dto.name } });
    if (existing !== null) {
      throw new ConflictException(`Feature flag '${dto.name}' already exists`);
    }

    const flag = this.flagRepo.create({
      name: dto.name,
      enabled: dto.enabled ?? false,
      description: dto.description,
      category: dto.category ?? 'System',
      updatedById: adminUserId,
    });

    const saved = await this.flagRepo.save(flag);
    this.logger.log(`✅ Feature flag '${dto.name}' created (enabled=${saved.enabled})`);

    // Update cache
    this.flagCache.set(saved.name, saved.enabled);

    return this.toResponseDto(saved);
  }

  /**
   * Update a feature flag
   */
  async update(
    name: string,
    dto: UpdateFeatureFlagDto,
    adminUserId?: string,
  ): Promise<FeatureFlagResponseDto> {
    const flag = await this.flagRepo.findOne({
      where: { name },
      relations: ['updatedBy'],
    });

    if (flag === null) {
      throw new NotFoundException(`Feature flag '${name}' not found`);
    }

    // Apply updates
    if (dto.enabled !== undefined) {
      flag.enabled = dto.enabled;
    }
    if (dto.description !== undefined) {
      flag.description = dto.description;
    }
    if (dto.category !== undefined) {
      flag.category = dto.category;
    }
    if (adminUserId !== undefined && adminUserId !== '') {
      flag.updatedById = adminUserId;
    }

    const saved = await this.flagRepo.save(flag);
    this.logger.log(
      `✅ Feature flag '${name}' updated to ${saved.enabled ? 'enabled' : 'disabled'}`,
    );

    // Update cache
    this.flagCache.set(saved.name, saved.enabled);

    return this.toResponseDto(saved);
  }

  /**
   * Toggle a feature flag (convenience method)
   */
  async toggle(name: string, adminUserId?: string): Promise<ToggleFeatureFlagResponseDto> {
    const flag = await this.flagRepo.findOne({
      where: { name },
      relations: ['updatedBy'],
    });

    if (flag === null) {
      return {
        success: false,
        message: `Feature flag '${name}' not found`,
      };
    }

    flag.enabled = !flag.enabled;
    if (adminUserId !== undefined && adminUserId !== '') {
      flag.updatedById = adminUserId;
    }

    const saved = await this.flagRepo.save(flag);
    this.logger.log(
      `✅ Feature flag '${name}' toggled to ${saved.enabled ? 'enabled' : 'disabled'}`,
    );

    // Update cache
    this.flagCache.set(saved.name, saved.enabled);

    return {
      success: true,
      message: `Feature flag '${name}' ${saved.enabled ? 'enabled' : 'disabled'}`,
      flag: this.toResponseDto(saved),
    };
  }

  /**
   * Delete a feature flag
   */
  async delete(name: string): Promise<{ success: boolean; message: string }> {
    const flag = await this.flagRepo.findOne({ where: { name } });

    if (flag === null) {
      throw new NotFoundException(`Feature flag '${name}' not found`);
    }

    await this.flagRepo.remove(flag);
    this.logger.log(`✅ Feature flag '${name}' deleted`);

    // Remove from cache
    this.flagCache.delete(name);

    return {
      success: true,
      message: `Feature flag '${name}' deleted`,
    };
  }

  /**
   * Check multiple flags at once
   */
  checkFlags(names: string[]): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const name of names) {
      result[name] = this.isEnabled(name);
    }
    return result;
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(flag: FeatureFlag): FeatureFlagResponseDto {
    return {
      id: flag.id,
      name: flag.name,
      enabled: flag.enabled,
      description: flag.description,
      category: flag.category,
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
      updatedById: flag.updatedById,
      updatedByEmail: flag.updatedBy?.email,
    };
  }
}

import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { ProductGroupResponseDto, ProductGroupWithProductsDto } from './dto/product-group.dto';

/**
 * Public controller for product groups
 * 
 * These endpoints are used by the storefront to display grouped products.
 * Groups consolidate multiple variants (platforms, editions, regions) into
 * a single card that opens a modal for variant selection.
 */
@ApiTags('Catalog - Groups')
@Controller('catalog/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  /**
   * List all active product groups
   * Used by the homepage/catalog to show group cards
   */
  @Get()
  @ApiOperation({
    summary: 'List all active product groups',
    description: 'Returns all active product groups for display in the catalog. Groups are ordered by displayOrder then createdAt.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active product groups',
    type: [ProductGroupResponseDto],
  })
  async listGroups(): Promise<ProductGroupResponseDto[]> {
    return this.groupsService.findAllActive();
  }

  /**
   * List all active spotlight groups (games)
   * Used by the homepage/games page to show spotlight cards
   */
  @Get('spotlights')
  @ApiOperation({
    summary: 'List all active spotlight groups',
    description: 'Returns all active spotlight groups for display on the homepage and games page. Ordered by spotlightOrder.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active spotlight groups',
    type: [ProductGroupResponseDto],
  })
  async listSpotlights(): Promise<ProductGroupResponseDto[]> {
    return this.groupsService.findAllActiveSpotlights();
  }

  /**
   * Get a spotlight group by slug with all its products
   * Used by the /games/[slug] page to render the full spotlight experience
   */
  @Get('spotlight/:slug')
  @ApiOperation({
    summary: 'Get spotlight game with all variants',
    description: 'Returns a spotlight group with all its published products. Used to render the /games/[slug] page.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Spotlight game slug (e.g., "gta-6")',
    example: 'gta-6',
  })
  @ApiResponse({
    status: 200,
    description: 'Spotlight group with all variant products',
    type: ProductGroupWithProductsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Spotlight game not found',
  })
  async getSpotlight(@Param('slug') slug: string): Promise<ProductGroupWithProductsDto> {
    return this.groupsService.findSpotlightBySlug(slug);
  }

  /**
   * Get a product group by slug or ID with all its products
   * Used when user clicks on a group card to open the variant modal
   */
  @Get(':slugOrId')
  @ApiOperation({
    summary: 'Get product group with all variants',
    description: 'Returns a product group with all its published products. Used to populate the variant selection modal.',
  })
  @ApiParam({
    name: 'slugOrId',
    description: 'Group slug (e.g., "battlefield-6") or UUID',
    example: 'battlefield-6',
  })
  @ApiResponse({
    status: 200,
    description: 'Product group with all variant products',
    type: ProductGroupWithProductsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async getGroup(@Param('slugOrId') slugOrId: string): Promise<ProductGroupWithProductsDto> {
    // Check if it looks like a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    if (isUuid) {
      return this.groupsService.findByIdWithProducts(slugOrId);
    } else {
      return this.groupsService.findBySlugWithProducts(slugOrId);
    }
  }
}

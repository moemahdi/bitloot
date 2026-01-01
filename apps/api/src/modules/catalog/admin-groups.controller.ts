import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { GroupsService } from './groups.service';
import {
  CreateProductGroupDto,
  UpdateProductGroupDto,
  AssignProductsToGroupDto,
  RemoveProductsFromGroupDto,
  ProductGroupResponseDto,
  ProductGroupWithProductsDto,
  ProductGroupListResponseDto,
  ListProductGroupsQueryDto,
  GroupProductVariantDto,
} from './dto/product-group.dto';

/**
 * Admin controller for managing product groups
 * 
 * Provides full CRUD operations and product assignment capabilities
 * for grouping multiple product variants together.
 */
@ApiTags('Admin - Product Groups')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/catalog/groups')
export class AdminGroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new product group
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new product group',
    description: 'Creates a new product group for consolidating multiple product variants.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product group created successfully',
    type: ProductGroupResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Group with this slug already exists' })
  async create(@Body() dto: CreateProductGroupDto): Promise<ProductGroupResponseDto> {
    return this.groupsService.create(dto);
  }

  /**
   * List all product groups with pagination
   */
  @Get()
  @ApiOperation({
    summary: 'List all product groups',
    description: 'Returns paginated list of product groups with optional filters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of product groups',
    type: ProductGroupListResponseDto,
  })
  async list(@Query() query: ListProductGroupsQueryDto): Promise<ProductGroupListResponseDto> {
    return this.groupsService.findAll(query);
  }

  /**
   * Get a single product group by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get product group by ID',
    description: 'Returns a single product group with all its products.',
  })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({
    status: 200,
    description: 'Product group with products',
    type: ProductGroupWithProductsDto,
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async findById(@Param('id') id: string): Promise<ProductGroupWithProductsDto> {
    return this.groupsService.findByIdWithProducts(id);
  }

  /**
   * Update a product group
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a product group',
    description: 'Updates an existing product group. All fields are optional.',
  })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({
    status: 200,
    description: 'Updated product group',
    type: ProductGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductGroupDto,
  ): Promise<ProductGroupResponseDto> {
    return this.groupsService.update(id, dto);
  }

  /**
   * Delete a product group
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a product group',
    description: 'Deletes a product group. Products in the group will become ungrouped.',
  })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({ status: 204, description: 'Group deleted successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.groupsService.delete(id);
  }

  // ============================================
  // PRODUCT ASSIGNMENT
  // ============================================

  /**
   * Assign products to a group
   */
  @Post(':id/products')
  @ApiOperation({
    summary: 'Assign products to a group',
    description: 'Adds one or more products to this group. Products will be removed from any previous group.',
  })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({
    status: 200,
    description: 'Updated group with all products',
    type: ProductGroupWithProductsDto,
  })
  @ApiResponse({ status: 400, description: 'One or more product IDs not found' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async assignProducts(
    @Param('id') id: string,
    @Body() dto: AssignProductsToGroupDto,
  ): Promise<ProductGroupWithProductsDto> {
    return this.groupsService.assignProducts(id, dto.productIds);
  }

  /**
   * Remove products from a group
   */
  @Delete(':id/products')
  @ApiOperation({
    summary: 'Remove products from a group',
    description: 'Removes one or more products from this group. Products become ungrouped.',
  })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({
    status: 200,
    description: 'Updated group with remaining products',
    type: ProductGroupWithProductsDto,
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async removeProducts(
    @Param('id') id: string,
    @Body() dto: RemoveProductsFromGroupDto,
  ): Promise<ProductGroupWithProductsDto> {
    return this.groupsService.removeProducts(id, dto.productIds);
  }

  /**
   * Get all products in a group
   */
  @Get(':id/products')
  @ApiOperation({
    summary: 'Get all products in a group',
    description: 'Returns all products assigned to this group.',
  })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of products in the group',
    type: [GroupProductVariantDto],
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroupProducts(@Param('id') id: string): Promise<GroupProductVariantDto[]> {
    return this.groupsService.getGroupProducts(id);
  }

  // ============================================
  // UTILITY ENDPOINTS
  // ============================================

  /**
   * Get all unassigned products
   */
  @Get('products/unassigned')
  @ApiOperation({
    summary: 'Get all unassigned products',
    description: 'Returns all products that are not assigned to any group. Useful for product assignment UI.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of unassigned products',
    type: [GroupProductVariantDto],
  })
  async getUnassignedProducts(): Promise<GroupProductVariantDto[]> {
    return this.groupsService.getUnassignedProducts();
  }

  /**
   * Refresh group stats
   */
  @Post(':id/refresh-stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh group statistics',
    description: 'Recalculates min/max price and product count for a group.',
  })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({ status: 200, description: 'Stats refreshed successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async refreshStats(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.groupsService.updateGroupStats(id);
    return { success: true };
  }

  /**
   * Refresh all group stats
   */
  @Post('refresh-all-stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh all group statistics',
    description: 'Recalculates min/max price and product count for all groups. Use after bulk price changes.',
  })
  @ApiResponse({ status: 200, description: 'All stats refreshed successfully' })
  async refreshAllStats(): Promise<{ success: boolean }> {
    await this.groupsService.updateAllGroupStats();
    return { success: true };
  }
}

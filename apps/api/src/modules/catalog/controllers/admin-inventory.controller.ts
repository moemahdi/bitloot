import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { AdminInventoryService } from '../services/admin-inventory.service';
import {
  AddInventoryItemDto,
  BulkImportInventoryDto,
  BulkDeleteInventoryDto,
  InventoryQueryDto,
  UpdateItemStatusDto,
  InventoryItemResponseDto,
  InventoryStatsDto,
  BulkImportResultDto,
  PaginatedInventoryDto,
} from '../dto/inventory.dto';
import { InventoryItemStatus } from '../types/product-delivery.types';

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Admin - Inventory')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/products/:productId/inventory')
export class AdminInventoryController {
  constructor(private readonly inventoryService: AdminInventoryService) {}

  // ============================================
  // ADD ITEMS
  // ============================================

  @Post()
  @ApiOperation({
    summary: 'Add single item to inventory',
    description:
      'Add a single digital item (key, account, code, etc.) to a custom product inventory. The item data will be encrypted at rest.',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({
    status: 201,
    type: InventoryItemResponseDto,
    description: 'Item added successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid item data or type mismatch' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Duplicate item' })
  async addItem(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: AddInventoryItemDto,
    @Request() req: AuthRequest,
  ): Promise<InventoryItemResponseDto> {
    return this.inventoryService.addItem(productId, dto, req.user.id);
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Bulk import items to inventory',
    description:
      'Import multiple items at once. Optionally skip duplicates. Maximum 1000 items per request.',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({
    status: 201,
    type: BulkImportResultDto,
    description: 'Bulk import completed',
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async bulkImport(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: BulkImportInventoryDto,
    @Request() req: AuthRequest,
  ): Promise<BulkImportResultDto> {
    return this.inventoryService.bulkImport(productId, dto, req.user.id);
  }

  // ============================================
  // LIST & STATS
  // ============================================

  @Get()
  @ApiOperation({
    summary: 'List inventory items',
    description:
      'Get paginated list of inventory items with optional filtering by status and supplier.',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({
    status: 200,
    type: PaginatedInventoryDto,
    description: 'Paginated inventory list',
  })
  async listItems(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: InventoryQueryDto,
  ): Promise<PaginatedInventoryDto> {
    return this.inventoryService.listItems(productId, query);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get inventory statistics',
    description:
      'Get statistics including counts by status, costs, revenue, and profit.',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({
    status: 200,
    type: InventoryStatsDto,
    description: 'Inventory statistics',
  })
  async getStats(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<InventoryStatsDto> {
    return this.inventoryService.getStats(productId);
  }

  // ============================================
  // ITEM MANAGEMENT
  // ============================================

  @Patch(':itemId/status')
  @ApiOperation({
    summary: 'Update item status',
    description:
      'Mark an item as invalid (with reason) or restore it to available. Cannot modify sold items.',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiParam({ name: 'itemId', description: 'Inventory item UUID' })
  @ApiResponse({
    status: 200,
    type: InventoryItemResponseDto,
    description: 'Status updated',
  })
  @ApiResponse({ status: 400, description: 'Invalid status change' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async updateStatus(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateItemStatusDto,
    @Request() req: AuthRequest,
  ): Promise<InventoryItemResponseDto> {
    return this.inventoryService.updateStatus(productId, itemId, dto, req.user.id);
  }

  @Delete(':itemId')
  @ApiOperation({
    summary: 'Delete an inventory item',
    description:
      'Permanently delete an available inventory item. Cannot delete reserved or sold items.',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiParam({ name: 'itemId', description: 'Inventory item UUID' })
  @ApiResponse({ status: 204, description: 'Item deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete (wrong status)' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async deleteItem(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Request() req: AuthRequest,
  ): Promise<void> {
    await this.inventoryService.deleteItem(productId, itemId, req.user.id);
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  @Post('bulk-delete')
  @ApiOperation({
    summary: 'Bulk delete inventory items',
    description:
      'Delete multiple items at once. Only available, expired, and invalid items can be deleted. Reserved/sold items are skipped.',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete result',
    schema: {
      type: 'object',
      properties: {
        deleted: { type: 'number' },
        skipped: { type: 'number' },
      },
    },
  })
  async bulkDelete(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() body: BulkDeleteInventoryDto,
    @Request() req: AuthRequest,
  ): Promise<{ deleted: number; skipped: number }> {
    return this.inventoryService.bulkDeleteItems(
      productId,
      body.itemIds,
      req.user.id,
    );
  }

  @Get('export')
  @ApiOperation({
    summary: 'Export inventory items',
    description:
      'Export inventory items as JSON. Optionally filter by status.',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiQuery({ name: 'status', required: false, description: 'Comma-separated statuses to filter by' })
  @ApiResponse({
    status: 200,
    type: [InventoryItemResponseDto],
    description: 'Exported inventory items',
  })
  async exportItems(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('status') status?: string,
  ): Promise<InventoryItemResponseDto[]> {
    const statuses = status !== undefined && status !== ''
      ? (status.split(',') as InventoryItemStatus[])
      : undefined;
    return this.inventoryService.exportItems(productId, statuses);
  }

  @Patch(':itemId/restore')
  @ApiOperation({
    summary: 'Restore item to available',
    description:
      'Restore an expired or invalid item back to available status.',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiParam({ name: 'itemId', description: 'Inventory item UUID' })
  @ApiResponse({
    status: 200,
    type: InventoryItemResponseDto,
    description: 'Item restored',
  })
  @ApiResponse({ status: 400, description: 'Cannot restore (wrong status)' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async restoreItem(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Request() req: AuthRequest,
  ): Promise<InventoryItemResponseDto> {
    return this.inventoryService.restoreItem(itemId, req.user.id);
  }
}

// ============================================
// GLOBAL INVENTORY ADMIN CONTROLLER
// ============================================

@ApiTags('Admin - Inventory (Global)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/inventory')
export class AdminInventoryGlobalController {
  constructor(private readonly inventoryService: AdminInventoryService) {}

  @Get('low-stock')
  @ApiOperation({
    summary: 'Get products with low stock',
    description:
      'Get all custom products where available stock is at or below the low stock threshold.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of low-stock products',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          productTitle: { type: 'string' },
          available: { type: 'number' },
          threshold: { type: 'number' },
        },
      },
    },
  })
  async getLowStock(): Promise<
    Array<{
      productId: string;
      productTitle: string;
      available: number;
      threshold: number;
    }>
  > {
    return this.inventoryService.getProductsWithLowStock();
  }

  @Post('expire')
  @ApiOperation({
    summary: 'Expire outdated items',
    description:
      'Manually trigger expiration of items past their expiration date. Returns count of expired items.',
  })
  @ApiResponse({
    status: 200,
    description: 'Number of items expired',
    schema: {
      type: 'object',
      properties: {
        expired: { type: 'number' },
      },
    },
  })
  async expireItems(): Promise<{ expired: number }> {
    const expired = await this.inventoryService.expireItems();
    return { expired };
  }

  @Post('release-reservations')
  @ApiOperation({
    summary: 'Release expired reservations',
    description:
      'Release inventory reservations that have been held longer than the specified time (default 30 minutes).',
  })
  @ApiResponse({
    status: 200,
    description: 'Number of reservations released',
    schema: {
      type: 'object',
      properties: {
        released: { type: 'number' },
      },
    },
  })
  async releaseReservations(
    @Query('maxAgeMinutes') maxAgeMinutes?: number,
  ): Promise<{ released: number }> {
    const released = await this.inventoryService.releaseExpiredReservations(
      maxAgeMinutes ?? 30,
    );
    return { released };
  }
}

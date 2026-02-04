import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminUsersService } from './admin-users.service';
import {
  AdminUserListQueryDto,
  PaginatedAdminUsersDto,
  AdminUserStatsDto,
  AdminUserDetailDto,
  UpdateAdminUserDto,
  ChangeUserRoleDto,
  SuspendUserDto,
  UserRole,
  UserStatus,
  PaginatedUserOrdersDto,
  PaginatedUserSessionsDto,
  PaginatedUserActivityDto,
  PaginatedUserReviewsDto,
  PaginatedUserPromosDto,
  PaginatedUserWatchlistDto,
} from './dto/admin-users.dto';

@ApiTags('Admin - Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  // ============ LIST & STATS ============

  @Get()
  @ApiOperation({ summary: 'List all users with filtering and pagination' })
  @ApiResponse({ status: 200, type: PaginatedAdminUsersDto })
  async listUsers(@Query() query: AdminUserListQueryDto): Promise<PaginatedAdminUsersDto> {
    return this.usersService.listUsers(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, type: AdminUserStatsDto })
  async getStats(): Promise<AdminUserStatsDto> {
    return this.usersService.getStats();
  }

  @Get('export')
  @ApiOperation({ summary: 'Export users as CSV' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  @ApiQuery({ name: 'status', enum: UserStatus, required: false })
  @ApiResponse({ status: 200, description: 'CSV file' })
  async exportUsers(
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Res() res?: Response,
  ): Promise<void> {
    const users = await this.usersService.exportUsers(role, status);

    // Generate CSV
    const headers = ['ID', 'Email', 'Role', 'Email Confirmed', 'Suspended', 'Created At', 'Last Login'];
    const rows = users.map((u) => {
      const lastLoginAt = u.lastLoginAt;
      const lastLoginStr = lastLoginAt !== null && lastLoginAt !== undefined ? new Date(lastLoginAt).toISOString() : '';
      return [
        u.id,
        u.email,
        u.role,
        u.emailConfirmed ? 'Yes' : 'No',
        u.isSuspended ? 'Yes' : 'No',
        u.createdAt.toISOString(),
        lastLoginStr,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res?.setHeader('Content-Type', 'text/csv');
    res?.setHeader('Content-Disposition', `attachment; filename=users-export-${Date.now()}.csv`);
    res?.send(csv);
  }

  // ============ USER DETAIL ============

  @Get(':id')
  @ApiOperation({ summary: 'Get user details by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdminUserDetailDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id', ParseUUIDPipe) id: string): Promise<AdminUserDetailDto> {
    return this.usersService.getUserById(id);
  }

  // ============ UPDATE ============

  @Patch(':id')
  @ApiOperation({ summary: 'Update user details' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdminUserDetailDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserDto,
  ): Promise<AdminUserDetailDto> {
    return this.usersService.updateUser(id, dto);
  }

  // ============ ROLE MANAGEMENT ============

  @Patch(':id/role')
  @ApiOperation({ summary: 'Change user role' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdminUserDetailDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeUserRoleDto,
  ): Promise<AdminUserDetailDto> {
    return this.usersService.changeRole(id, dto);
  }

  // ============ SUSPEND / UNSUSPEND ============

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdminUserDetailDto })
  @ApiResponse({ status: 400, description: 'User is already suspended' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async suspendUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendUserDto,
  ): Promise<AdminUserDetailDto> {
    return this.usersService.suspendUser(id, dto);
  }

  @Post(':id/unsuspend')
  @ApiOperation({ summary: 'Unsuspend a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdminUserDetailDto })
  @ApiResponse({ status: 400, description: 'User is not suspended' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unsuspendUser(@Param('id', ParseUUIDPipe) id: string): Promise<AdminUserDetailDto> {
    return this.usersService.unsuspendUser(id);
  }

  // ============ FORCE LOGOUT ============

  @Post(':id/force-logout')
  @ApiOperation({ summary: 'Force logout user from all sessions' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, schema: { properties: { revokedCount: { type: 'number' } } } })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forceLogout(@Param('id', ParseUUIDPipe) id: string): Promise<{ revokedCount: number }> {
    return this.usersService.forceLogout(id);
  }

  // ============ DELETE / RESTORE ============

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, schema: { properties: { message: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.usersService.softDeleteUser(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdminUserDetailDto })
  @ApiResponse({ status: 400, description: 'User is not deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async restoreUser(@Param('id', ParseUUIDPipe) id: string): Promise<AdminUserDetailDto> {
    return this.usersService.restoreUser(id);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a user (GDPR)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, schema: { properties: { message: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: 'User not found' })
  async hardDeleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.usersService.hardDeleteUser(id);
  }

  // ============ USER DATA: ORDERS ============

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get user orders' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'offset', type: 'number', required: false })
  @ApiResponse({ status: 200, type: PaginatedUserOrdersDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserOrders(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<PaginatedUserOrdersDto> {
    return this.usersService.getUserOrders(id, limit ?? 20, offset ?? 0);
  }

  // ============ USER DATA: SESSIONS ============

  @Get(':id/sessions')
  @ApiOperation({ summary: 'Get user sessions' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'offset', type: 'number', required: false })
  @ApiResponse({ status: 200, type: PaginatedUserSessionsDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserSessions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<PaginatedUserSessionsDto> {
    return this.usersService.getUserSessions(id, limit ?? 20, offset ?? 0);
  }

  @Delete(':id/sessions/:sessionId')
  @ApiOperation({ summary: 'Revoke a specific user session' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'sessionId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, schema: { properties: { message: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: 'User or session not found' })
  async revokeSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<{ message: string }> {
    return this.usersService.revokeSession(id, sessionId);
  }

  // ============ USER DATA: ACTIVITY ============

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity log' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'offset', type: 'number', required: false })
  @ApiResponse({ status: 200, type: PaginatedUserActivityDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<PaginatedUserActivityDto> {
    return this.usersService.getUserActivity(id, limit ?? 20, offset ?? 0);
  }

  // ============ USER DATA: REVIEWS ============

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get user reviews' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'offset', type: 'number', required: false })
  @ApiResponse({ status: 200, type: PaginatedUserReviewsDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserReviews(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<PaginatedUserReviewsDto> {
    return this.usersService.getUserReviews(id, limit ?? 20, offset ?? 0);
  }

  // ============ USER DATA: PROMOS ============

  @Get(':id/promos')
  @ApiOperation({ summary: 'Get user promo redemptions' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'offset', type: 'number', required: false })
  @ApiResponse({ status: 200, type: PaginatedUserPromosDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPromos(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<PaginatedUserPromosDto> {
    return this.usersService.getUserPromos(id, limit ?? 20, offset ?? 0);
  }

  // ============ USER DATA: WATCHLIST ============

  @Get(':id/watchlist')
  @ApiOperation({ summary: 'Get user watchlist' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'offset', type: 'number', required: false })
  @ApiResponse({ status: 200, type: PaginatedUserWatchlistDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserWatchlist(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<PaginatedUserWatchlistDto> {
    return this.usersService.getUserWatchlist(id, limit ?? 20, offset ?? 0);
  }
}

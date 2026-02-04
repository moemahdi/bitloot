import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

// ============ ENUMS ============

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

// ============ LIST/FILTER DTOs ============

export class AdminUserListQueryDto {
  @ApiPropertyOptional({ description: 'Number of items per page', default: 25 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 25;

  @ApiPropertyOptional({ description: 'Offset for pagination', default: 0 })
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;

  @ApiPropertyOptional({ description: 'Search by email (partial match)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by role', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Filter by status', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Filter by email confirmed status' })
  @IsOptional()
  @Type(() => Boolean)
  emailConfirmed?: boolean;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['email', 'createdAt', 'lastLoginAt', 'ordersCount', 'totalSpent'] })
  @IsOptional()
  @IsString()
  sortBy?: 'email' | 'createdAt' | 'lastLoginAt' | 'ordersCount' | 'totalSpent';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'] as const)
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// ============ RESPONSE DTOs ============

export class AdminUserListItemDto {
  @ApiProperty({ description: 'User ID' })
  id!: string;

  @ApiProperty({ description: 'User email' })
  email!: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  role!: UserRole;

  @ApiProperty({ description: 'Is email confirmed' })
  emailConfirmed!: boolean;

  @ApiProperty({ description: 'Is account suspended' })
  isSuspended!: boolean;

  @ApiProperty({ description: 'Is account deleted (soft delete)' })
  isDeleted!: boolean;

  @ApiProperty({ description: 'Status', enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({ description: 'Number of orders placed' })
  ordersCount!: number;

  @ApiProperty({ description: 'Total spent (EUR)' })
  totalSpent!: number;

  @ApiProperty({ description: 'Number of reviews submitted' })
  reviewsCount!: number;

  @ApiPropertyOptional({ description: 'Last login timestamp' })
  lastLoginAt?: Date | null;

  @ApiProperty({ description: 'Account created at' })
  createdAt!: Date;
}

export class PaginatedAdminUsersDto {
  @ApiProperty({ type: [AdminUserListItemDto] })
  data!: AdminUserListItemDto[];

  @ApiProperty({ description: 'Total number of users' })
  total!: number;

  @ApiProperty({ description: 'Current page limit' })
  limit!: number;

  @ApiProperty({ description: 'Current offset' })
  offset!: number;
}

export class AdminUserStatsDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers!: number;

  @ApiProperty({ description: 'Number of admin users' })
  adminCount!: number;

  @ApiProperty({ description: 'Users registered this week' })
  newThisWeek!: number;

  @ApiProperty({ description: 'Users active today (has session activity)' })
  activeToday!: number;

  @ApiProperty({ description: 'Total suspended users' })
  suspendedCount!: number;

  @ApiProperty({ description: 'Total deleted users' })
  deletedCount!: number;
}

export class AdminUserDetailDto {
  @ApiProperty({ description: 'User ID' })
  id!: string;

  @ApiProperty({ description: 'User email' })
  email!: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  role!: UserRole;

  @ApiProperty({ description: 'Is email confirmed' })
  emailConfirmed!: boolean;

  @ApiProperty({ description: 'Pending email change' })
  pendingEmail?: string | null;

  @ApiProperty({ description: 'Is account suspended' })
  isSuspended!: boolean;

  @ApiPropertyOptional({ description: 'When suspended' })
  suspendedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Reason for suspension' })
  suspendedReason?: string | null;

  @ApiProperty({ description: 'Is account deleted' })
  isDeleted!: boolean;

  @ApiPropertyOptional({ description: 'When deleted' })
  deletedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Deletion requested at' })
  deletionRequestedAt?: Date | null;

  @ApiProperty({ description: 'Status', enum: UserStatus })
  status!: UserStatus;

  @ApiPropertyOptional({ description: 'Last login timestamp' })
  lastLoginAt?: Date | null;

  @ApiProperty({ description: 'Account created at' })
  createdAt!: Date;

  @ApiProperty({ description: 'Account updated at' })
  updatedAt!: Date;

  // ============ COMPUTED STATS ============

  @ApiProperty({ description: 'Number of orders placed' })
  ordersCount!: number;

  @ApiProperty({ description: 'Total spent (EUR)' })
  totalSpent!: number;

  @ApiProperty({ description: 'Average order value (EUR)' })
  avgOrderValue!: number;

  @ApiProperty({ description: 'Number of reviews submitted' })
  reviewsCount!: number;

  @ApiProperty({ description: 'Average review rating' })
  avgRating!: number | null;

  @ApiProperty({ description: 'Number of promo codes redeemed' })
  promosRedeemed!: number;

  @ApiProperty({ description: 'Number of items in watchlist' })
  watchlistCount!: number;

  @ApiProperty({ description: 'Number of active sessions' })
  sessionsCount!: number;

  @ApiPropertyOptional({ description: 'Last active session timestamp' })
  lastActiveAt?: Date | null;
}

// ============ CREATE/UPDATE DTOs ============

export class CreateAdminUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'User role', enum: UserRole, default: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.USER;

  @ApiPropertyOptional({ description: 'Send welcome email with OTP for first login', default: true })
  @IsOptional()
  @IsBoolean()
  sendWelcomeEmail?: boolean = true;
}

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ description: 'New email address' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class ChangeUserRoleDto {
  @ApiProperty({ description: 'New role', enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({ description: 'Reason for role change' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class SuspendUserDto {
  @ApiProperty({ description: 'Reason for suspension' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}

// ============ USER ORDERS/SESSIONS/ACTIVITY DTOs ============

export class AdminUserOrderDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  total!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  itemsCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  paidAt?: Date | null;

  @ApiPropertyOptional()
  fulfilledAt?: Date | null;
}

export class PaginatedUserOrdersDto {
  @ApiProperty({ type: [AdminUserOrderDto] })
  data!: AdminUserOrderDto[];

  @ApiProperty()
  total!: number;
}

export class AdminUserSessionDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  deviceInfo?: string | null;

  @ApiPropertyOptional()
  ipAddress?: string | null;

  @ApiPropertyOptional()
  location?: string | null;

  @ApiProperty()
  isRevoked!: boolean;

  @ApiPropertyOptional()
  lastActiveAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  expiresAt!: Date;
}

export class PaginatedUserSessionsDto {
  @ApiProperty({ type: [AdminUserSessionDto] })
  data!: AdminUserSessionDto[];

  @ApiProperty()
  total!: number;
}

export class AdminUserActivityDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  action!: string;

  @ApiPropertyOptional()
  target?: string | null;

  @ApiPropertyOptional()
  details?: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class PaginatedUserActivityDto {
  @ApiProperty({ type: [AdminUserActivityDto] })
  data!: AdminUserActivityDto[];

  @ApiProperty()
  total!: number;
}

export class AdminUserReviewDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  productId?: string | null;

  @ApiPropertyOptional()
  productTitle?: string | null;

  @ApiProperty()
  rating!: number;

  @ApiPropertyOptional()
  title?: string | null;

  @ApiPropertyOptional()
  content?: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class PaginatedUserReviewsDto {
  @ApiProperty({ type: [AdminUserReviewDto] })
  data!: AdminUserReviewDto[];

  @ApiProperty()
  total!: number;
}

export class AdminUserPromoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  discountAmount!: number;

  @ApiProperty()
  discountType!: string;

  @ApiPropertyOptional()
  orderId?: string | null;

  @ApiProperty()
  redeemedAt!: Date;
}

export class PaginatedUserPromosDto {
  @ApiProperty({ type: [AdminUserPromoDto] })
  data!: AdminUserPromoDto[];

  @ApiProperty()
  total!: number;
}

export class AdminUserWatchlistItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiPropertyOptional()
  productTitle?: string | null;

  @ApiPropertyOptional()
  productCoverImage?: string | null;

  @ApiPropertyOptional()
  productPrice?: number | null;

  @ApiProperty()
  addedAt!: Date;
}

export class PaginatedUserWatchlistDto {
  @ApiProperty({ type: [AdminUserWatchlistItemDto] })
  data!: AdminUserWatchlistItemDto[];

  @ApiProperty()
  total!: number;
}

// ============ EXPORT DTO ============

export class ExportUsersQueryDto {
  @ApiPropertyOptional({ description: 'Filter by role', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Filter by status', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Export format', enum: ['csv', 'json'], default: 'csv' })
  @IsOptional()
  @IsString()
  format?: 'csv' | 'json' = 'csv';
}

// ============ SIMPLE RESPONSE DTOs ============

export class AdminUserMessageDto {
  @ApiProperty({ description: 'Success message' })
  message!: string;
}

export class AdminUserCreatedDto {
  @ApiProperty({ description: 'Created user ID' })
  id!: string;

  @ApiProperty({ description: 'User email' })
  email!: string;

  @ApiProperty({ description: 'Success message' })
  message!: string;
}

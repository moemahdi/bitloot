import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThanOrEqual } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Session } from '../../database/entities/session.entity';
import { Order } from '../orders/order.entity';
import { Review } from '../../database/entities/review.entity';
import { WatchlistItem } from '../../database/entities/watchlist-item.entity';
import { PromoRedemption } from '../promos/entities/promoredemption.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import {
  AdminUserListQueryDto,
  AdminUserListItemDto,
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

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    @InjectRepository(WatchlistItem) private readonly watchlistRepo: Repository<WatchlistItem>,
    @InjectRepository(PromoRedemption) private readonly promoRedemptionRepo: Repository<PromoRedemption>,
    @InjectRepository(AuditLog) private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  // ============ LIST USERS ============

  async listUsers(query: AdminUserListQueryDto): Promise<PaginatedAdminUsersDto> {
    const { limit = 25, offset = 0, search, role, status, emailConfirmed, sortBy, sortOrder = 'desc' } = query;

    const qb = this.userRepo.createQueryBuilder('user');

    // Include soft-deleted users for admin view
    qb.withDeleted();

    // Search by email
    if (search !== undefined && search !== '') {
      qb.andWhere('user.email ILIKE :search', { search: `%${search}%` });
    }

    // Filter by role
    if (role !== undefined) {
      qb.andWhere('user.role = :role', { role });
    }

    // Filter by status
    if (status === UserStatus.ACTIVE) {
      qb.andWhere('user.deletedAt IS NULL');
      qb.andWhere('user.isSuspended = :suspended', { suspended: false });
    } else if (status === UserStatus.SUSPENDED) {
      qb.andWhere('user.deletedAt IS NULL');
      qb.andWhere('user.isSuspended = :suspended', { suspended: true });
    } else if (status === UserStatus.DELETED) {
      qb.andWhere('user.deletedAt IS NOT NULL');
    }

    // Filter by email confirmed
    if (emailConfirmed !== undefined) {
      qb.andWhere('user.emailConfirmed = :emailConfirmed', { emailConfirmed });
    }

    // Get total count
    const total = await qb.getCount();

    // Sorting
    const orderField = this.getSortField(sortBy);
    qb.orderBy(orderField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // Pagination
    qb.skip(offset).take(limit);

    const users = await qb.getMany();

    // Compute stats for each user
    const data = await Promise.all(
      users.map(async (user) => this.mapToListItem(user)),
    );

    return { data, total, limit, offset };
  }

  // ============ USER STATS ============

  async getStats(): Promise<AdminUserStatsDto> {
    // Total users (excluding deleted)
    const totalUsers = await this.userRepo.count({ where: { deletedAt: IsNull() } });

    // Admin count
    const adminCount = await this.userRepo.count({
      where: { role: 'admin', deletedAt: IsNull() },
    });

    // New this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newThisWeek = await this.userRepo.count({
      where: {
        createdAt: MoreThanOrEqual(weekAgo),
        deletedAt: IsNull(),
      },
    });

    // Active today (has session activity in last 24 hours)
    const dayAgo = new Date();
    dayAgo.setHours(dayAgo.getHours() - 24);
    const activeTodayResult = await this.sessionRepo
      .createQueryBuilder('session')
      .select('COUNT(DISTINCT session.userId)', 'count')
      .where('session.lastActiveAt >= :dayAgo', { dayAgo })
      .andWhere('session.isRevoked = :revoked', { revoked: false })
      .getRawOne<{ count: string }>();
    const activeToday = parseInt(activeTodayResult?.count ?? '0', 10);

    // Suspended count
    const suspendedCount = await this.userRepo.count({
      where: { isSuspended: true, deletedAt: IsNull() },
    });

    // Deleted count (soft deleted)
    const deletedCount = await this.userRepo
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.deletedAt IS NOT NULL')
      .getCount();

    return {
      totalUsers,
      adminCount,
      newThisWeek,
      activeToday,
      suspendedCount,
      deletedCount,
    };
  }

  // ============ GET USER DETAIL ============

  async getUserById(id: string): Promise<AdminUserDetailDto> {
    const user: User | null = await this.userRepo
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.id = :id', { id })
      .getOne();

    if (user === null) {
      throw new NotFoundException('User not found');
    }

    return this.mapToDetail(user);
  }

  // ============ UPDATE USER ============

  async updateUser(id: string, dto: UpdateAdminUserDto): Promise<AdminUserDetailDto> {
    const user = await this.findUserOrThrow(id);

    if (dto.email !== undefined && dto.email !== '' && dto.email !== user.email) {
      // Check if new email is already taken
      const existing = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existing !== null) {
        throw new ConflictException('Email already registered');
      }
      user.email = dto.email;
      user.emailConfirmed = false; // Require re-confirmation
    }

    await this.userRepo.save(user);
    return this.mapToDetail(user);
  }

  // ============ CHANGE ROLE ============

  async changeRole(id: string, dto: ChangeUserRoleDto): Promise<AdminUserDetailDto> {
    const user = await this.findUserOrThrow(id);

    user.role = dto.role;
    await this.userRepo.save(user);

    return this.mapToDetail(user);
  }

  // ============ SUSPEND/UNSUSPEND ============

  async suspendUser(id: string, dto: SuspendUserDto): Promise<AdminUserDetailDto> {
    const user = await this.findUserOrThrow(id);

    if (user.isSuspended) {
      throw new BadRequestException('User is already suspended');
    }

    user.isSuspended = true;
    user.suspendedAt = new Date();
    user.suspendedReason = dto.reason;

    await this.userRepo.save(user);

    // Revoke all sessions for suspended user
    await this.revokeAllSessions(id);

    return this.mapToDetail(user);
  }

  async unsuspendUser(id: string): Promise<AdminUserDetailDto> {
    const user = await this.findUserOrThrow(id);

    if (!user.isSuspended) {
      throw new BadRequestException('User is not suspended');
    }

    user.isSuspended = false;
    user.suspendedAt = null;
    user.suspendedReason = null;

    await this.userRepo.save(user);
    return this.mapToDetail(user);
  }

  // ============ FORCE LOGOUT ============

  async forceLogout(id: string): Promise<{ revokedCount: number }> {
    await this.findUserOrThrow(id);
    const revokedCount = await this.revokeAllSessions(id);
    return { revokedCount };
  }

  // ============ SOFT DELETE ============

  async softDeleteUser(id: string): Promise<{ message: string }> {
    const user = await this.findUserOrThrow(id);

    // Soft delete
    await this.userRepo.softDelete(id);

    // Revoke all sessions
    await this.revokeAllSessions(id);

    return { message: `User ${user.email} has been deleted` };
  }

  // ============ RESTORE USER ============

  async restoreUser(id: string): Promise<AdminUserDetailDto> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.id = :id', { id })
      .getOne();

    if (user === null) {
      throw new NotFoundException('User not found');
    }

    if (user.deletedAt === null || user.deletedAt === undefined) {
      throw new BadRequestException('User is not deleted');
    }

    await this.userRepo.restore(id);

    // Clear deletion request if any
    await this.userRepo.update(id, { deletionRequestedAt: null });

    return this.getUserById(id);
  }

  // ============ HARD DELETE (GDPR) ============

  async hardDeleteUser(id: string): Promise<{ message: string }> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.id = :id', { id })
      .getOne();

    if (user === null) {
      throw new NotFoundException('User not found');
    }

    // Permanently delete - cascades will handle related records
    await this.userRepo.delete(id);

    return { message: `User ${user.email} has been permanently deleted` };
  }

  // ============ USER ORDERS ============

  async getUserOrders(id: string, limit = 20, offset = 0): Promise<PaginatedUserOrdersDto> {
    await this.findUserOrThrow(id);

    const [orders, total] = await this.orderRepo.findAndCount({
      where: { userId: id },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['items'],
    });

    return {
      data: orders.map((order) => ({
        id: order.id,
        status: order.status,
        total: order.totalCrypto,
        currency: 'EUR',
        itemsCount: order.items?.length ?? 0,
        createdAt: order.createdAt,
        paidAt: null, // Order doesn't track paidAt separately
        fulfilledAt: null, // Order doesn't track fulfilledAt separately
      })),
      total,
    };
  }

  // ============ USER SESSIONS ============

  async getUserSessions(id: string, limit = 20, offset = 0): Promise<PaginatedUserSessionsDto> {
    await this.findUserOrThrow(id);

    const [sessions, total] = await this.sessionRepo.findAndCount({
      where: { userId: id },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: sessions.map((session) => ({
        id: session.id,
        deviceInfo: session.deviceInfo ?? null,
        ipAddress: session.ipAddress ?? null,
        location: session.location ?? null,
        isRevoked: session.isRevoked,
        lastActiveAt: session.lastActiveAt ?? null,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      })),
      total,
    };
  }

  // ============ REVOKE SESSION ============

  async revokeSession(userId: string, sessionId: string): Promise<{ message: string }> {
    await this.findUserOrThrow(userId);

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
    });

    if (session === null) {
      throw new NotFoundException('Session not found');
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    await this.sessionRepo.save(session);

    return { message: 'Session revoked' };
  }

  // ============ USER ACTIVITY ============

  async getUserActivity(id: string, limit = 20, offset = 0): Promise<PaginatedUserActivityDto> {
    await this.findUserOrThrow(id);

    // Get audit logs for this user (as target or subject)
    const [logs, total] = await this.auditLogRepo.findAndCount({
      where: [
        { target: `user:${id}` },
        { adminUserId: id }, // If user is admin, show their admin actions too
      ],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        target: log.target ?? null,
        details: log.details ?? null,
        createdAt: log.createdAt,
      })),
      total,
    };
  }

  // ============ USER REVIEWS ============

  async getUserReviews(id: string, limit = 20, offset = 0): Promise<PaginatedUserReviewsDto> {
    await this.findUserOrThrow(id);

    const [reviews, total] = await this.reviewRepo.findAndCount({
      where: { userId: id },
      order: { createdAt: 'DESC' },
      relations: ['product'],
      take: limit,
      skip: offset,
    });

    return {
      data: reviews.map((review) => ({
        id: review.id,
        productId: review.productId ?? null,
        productTitle: review.product?.title ?? null,
        rating: review.rating,
        title: review.title ?? null,
        content: review.content ?? null,
        status: review.status,
        createdAt: review.createdAt,
      })),
      total,
    };
  }

  // ============ USER PROMOS ============

  async getUserPromos(id: string, limit = 20, offset = 0): Promise<PaginatedUserPromosDto> {
    await this.findUserOrThrow(id);

    const [redemptions, total] = await this.promoRedemptionRepo.findAndCount({
      where: { userId: id },
      order: { createdAt: 'DESC' },
      relations: ['promoCode'],
      take: limit,
      skip: offset,
    });

    return {
      data: redemptions.map((r) => ({
        id: r.id,
        code: r.promoCode?.code ?? 'Unknown',
        discountAmount: parseFloat(r.discountApplied ?? '0'),
        discountType: r.promoCode?.discountType ?? 'percent',
        orderId: r.orderId ?? null,
        redeemedAt: r.createdAt,
      })),
      total,
    };
  }

  // ============ USER WATCHLIST ============

  async getUserWatchlist(id: string, limit = 20, offset = 0): Promise<PaginatedUserWatchlistDto> {
    await this.findUserOrThrow(id);

    const [items, total] = await this.watchlistRepo.findAndCount({
      where: { userId: id },
      order: { createdAt: 'DESC' },
      relations: ['product'],
      take: limit,
      skip: offset,
    });

    return {
      data: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productTitle: item.product?.title ?? null,
        productCoverImage: item.product?.coverImageUrl ?? null,
        productPrice: item.product?.price !== undefined ? parseFloat(item.product.price) : null,
        addedAt: item.createdAt,
      })),
      total,
    };
  }

  // ============ EXPORT USERS ============

  async exportUsers(role?: UserRole, status?: UserStatus): Promise<User[]> {
    const qb = this.userRepo.createQueryBuilder('user');

    if (status === UserStatus.DELETED) {
      qb.withDeleted().where('user.deletedAt IS NOT NULL');
    } else {
      if (status === UserStatus.SUSPENDED) {
        qb.andWhere('user.isSuspended = :suspended', { suspended: true });
      } else if (status === UserStatus.ACTIVE) {
        qb.andWhere('user.isSuspended = :suspended', { suspended: false });
      }
    }

    if (role !== undefined) {
      qb.andWhere('user.role = :role', { role });
    }

    qb.orderBy('user.createdAt', 'DESC');

    return qb.getMany();
  }

  // ============ HELPER METHODS ============

  private async findUserOrThrow(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (user === null) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async revokeAllSessions(userId: string): Promise<number> {
    const result = await this.sessionRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );
    return result.affected ?? 0;
  }

  private getSortField(sortBy?: string): string {
    switch (sortBy) {
      case 'email':
        return 'user.email';
      case 'lastLoginAt':
        return 'user.lastLoginAt';
      case 'ordersCount':
      case 'totalSpent':
        // These require subqueries - default to createdAt for now
        return 'user.createdAt';
      default:
        return 'user.createdAt';
    }
  }

  private async mapToListItem(user: User): Promise<AdminUserListItemDto> {
    // Get order stats
    const orderStats = await this.orderRepo
      .createQueryBuilder('order')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(CAST(order.totalCrypto AS DECIMAL)), 0)', 'total')
      .where('order.userId = :userId', { userId: user.id })
      .getRawOne<{ count: string; total: string }>();

    // Get review count
    const reviewsCount = await this.reviewRepo.count({ where: { userId: user.id } });

    const isDeleted = user.deletedAt !== null && user.deletedAt !== undefined;
    let status: UserStatus = UserStatus.ACTIVE;
    if (isDeleted) {
      status = UserStatus.DELETED;
    } else if (user.isSuspended) {
      status = UserStatus.SUSPENDED;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      emailConfirmed: user.emailConfirmed,
      isSuspended: user.isSuspended,
      isDeleted,
      status,
      ordersCount: parseInt(orderStats?.count ?? '0', 10),
      totalSpent: parseFloat(orderStats?.total ?? '0'),
      reviewsCount,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
    };
  }

  private async mapToDetail(user: User): Promise<AdminUserDetailDto> {
    const isDeleted = user.deletedAt !== null && user.deletedAt !== undefined;
    let status: UserStatus = UserStatus.ACTIVE;
    if (isDeleted) {
      status = UserStatus.DELETED;
    } else if (user.isSuspended) {
      status = UserStatus.SUSPENDED;
    }

    // Order stats
    const orderStats = await this.orderRepo
      .createQueryBuilder('order')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(CAST(order.totalCrypto AS DECIMAL)), 0)', 'total')
      .where('order.userId = :userId', { userId: user.id })
      .getRawOne<{ count: string; total: string }>();

    const ordersCount = parseInt(orderStats?.count ?? '0', 10);
    const totalSpent = parseFloat(orderStats?.total ?? '0');
    const avgOrderValue = ordersCount > 0 ? totalSpent / ordersCount : 0;

    // Review stats
    const reviewStats = await this.reviewRepo
      .createQueryBuilder('review')
      .select('COUNT(*)', 'count')
      .addSelect('AVG(review.rating)', 'avgRating')
      .where('review.userId = :userId', { userId: user.id })
      .getRawOne<{ count: string; avgRating: string | null }>();

    const reviewsCount = parseInt(reviewStats?.count ?? '0', 10);
    const avgRatingStr = reviewStats?.avgRating;
    const avgRating = avgRatingStr !== null && avgRatingStr !== undefined ? parseFloat(avgRatingStr) : null;

    // Promo redemptions
    const promosRedeemed = await this.promoRedemptionRepo.count({ where: { userId: user.id } });

    // Watchlist count
    const watchlistCount = await this.watchlistRepo.count({ where: { userId: user.id } });

    // Sessions
    const sessionsCount = await this.sessionRepo.count({
      where: { userId: user.id, isRevoked: false },
    });

    const lastSession = await this.sessionRepo.findOne({
      where: { userId: user.id, isRevoked: false },
      order: { lastActiveAt: 'DESC' },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      emailConfirmed: user.emailConfirmed,
      pendingEmail: user.pendingEmail ?? null,
      isSuspended: user.isSuspended,
      suspendedAt: user.suspendedAt ?? null,
      suspendedReason: user.suspendedReason ?? null,
      isDeleted,
      deletedAt: user.deletedAt ?? null,
      deletionRequestedAt: user.deletionRequestedAt ?? null,
      status,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ordersCount,
      totalSpent,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      reviewsCount,
      avgRating: avgRating !== null && !isNaN(avgRating) ? Math.round(avgRating * 10) / 10 : null,
      promosRedeemed,
      watchlistCount,
      sessionsCount,
      lastActiveAt: lastSession?.lastActiveAt ?? null,
    };
  }
}

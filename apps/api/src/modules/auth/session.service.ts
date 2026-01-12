import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { createHash } from 'crypto';
import { Session } from '../../database/entities/session.entity';

/**
 * Device info parsed from User-Agent
 */
interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  summary: string;
}

/**
 * Session creation input
 */
interface CreateSessionInput {
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Session response DTO
 */
export interface SessionResponseDto {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  location: string | null;
  lastActiveAt: Date | null;
  createdAt: Date;
  isCurrent: boolean;
}

/**
 * Session Service: Manages user login sessions
 * Enables viewing active sessions, revoking sessions, and logout from all devices
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  /**
   * Hash refresh token for storage
   * We store hash, not the actual token, for security
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Parse User-Agent to extract device/browser info
   */
  private parseUserAgent(userAgent?: string): DeviceInfo {
    if (userAgent === undefined || userAgent === null || userAgent === '') {
      return {
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Unknown',
        summary: 'Unknown Device',
      };
    }

    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // Detect browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      browser = match?.[1] !== undefined ? `Chrome ${match[1]}` : 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      browser = match?.[1] !== undefined ? `Firefox ${match[1]}` : 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/);
      browser = match?.[1] !== undefined ? `Safari ${match[1]}` : 'Safari';
    } else if (userAgent.includes('Edg')) {
      const match = userAgent.match(/Edg\/(\d+)/);
      browser = match?.[1] !== undefined ? `Edge ${match[1]}` : 'Edge';
    }

    // Detect OS
    if (userAgent.includes('Windows NT 10')) {
      os = 'Windows 10/11';
    } else if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac OS X')) {
      const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
      os = match?.[1] !== undefined ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
      device = 'Mobile';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      os = 'iOS';
      device = userAgent.includes('iPad') ? 'Tablet' : 'Mobile';
    }

    // Detect device type
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
      device = 'Mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      device = 'Tablet';
    }

    return {
      browser,
      os,
      device,
      summary: `${browser} on ${os}`,
    };
  }

  /**
   * Create a new session when user logs in
   */
  async create(input: CreateSessionInput): Promise<Session> {
    const tokenHash = this.hashToken(input.refreshToken);
    const deviceInfo = this.parseUserAgent(input.userAgent);

    // Session expires in 7 days (matches refresh token)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = this.sessionRepository.create({
      userId: input.userId,
      refreshTokenHash: tokenHash,
      deviceInfo: deviceInfo.summary,
      userAgent: input.userAgent?.substring(0, 500),
      ipAddress: input.ipAddress,
      expiresAt,
      lastActiveAt: new Date(),
      isRevoked: false,
    });

    const saved = await this.sessionRepository.save(session);
    this.logger.log(`✅ Session created for user ${input.userId}: ${deviceInfo.summary}`);

    return saved;
  }

  /**
   * Find session by refresh token hash
   */
  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const tokenHash = this.hashToken(refreshToken);
    return this.sessionRepository.findOne({
      where: {
        refreshTokenHash: tokenHash,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  /**
   * Update session's last active time and optionally new refresh token
   */
  async updateActivity(sessionId: string, newRefreshToken?: string): Promise<void> {
    const updates: Partial<Session> = {
      lastActiveAt: new Date(),
    };

    if (newRefreshToken !== undefined && newRefreshToken !== null && newRefreshToken !== '') {
      updates.refreshTokenHash = this.hashToken(newRefreshToken);
      // Extend expiration for 7 more days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      updates.expiresAt = expiresAt;
    }

    await this.sessionRepository.update(sessionId, updates);
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(
    userId: string,
    currentRefreshToken?: string,
  ): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepository.find({
      where: {
        userId,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { lastActiveAt: 'DESC' },
    });

    const currentTokenHash = currentRefreshToken !== undefined && currentRefreshToken !== null && currentRefreshToken !== '' 
                             ? this.hashToken(currentRefreshToken) 
                             : null;

    return sessions.map((session) => ({
      id: session.id,
      deviceInfo: session.deviceInfo ?? null,
      ipAddress: session.ipAddress ?? null,
      location: session.location ?? null,
      lastActiveAt: session.lastActiveAt ?? null,
      createdAt: session.createdAt,
      isCurrent: currentTokenHash !== null && currentTokenHash !== undefined
                 ? session.refreshTokenHash === currentTokenHash 
                 : false,
    }));
  }

  /**
   * Get all active sessions for a user, marking current session by ID
   */
  async getActiveSessionsWithCurrent(
    userId: string,
    currentSessionId?: string,
  ): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepository.find({
      where: {
        userId,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { lastActiveAt: 'DESC' },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceInfo: session.deviceInfo ?? null,
      ipAddress: session.ipAddress ?? null,
      location: session.location ?? null,
      lastActiveAt: session.lastActiveAt ?? null,
      createdAt: session.createdAt,
      isCurrent: currentSessionId !== undefined && currentSessionId !== null && currentSessionId !== ''
                 ? session.id === currentSessionId 
                 : false,
    }));
  }

  /**
   * Get paginated active sessions for a user, marking current session by ID
   */
  async getActiveSessionsPaginated(
    userId: string,
    currentSessionId?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ sessions: SessionResponseDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [sessions, total] = await this.sessionRepository.findAndCount({
      where: {
        userId,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { lastActiveAt: 'DESC' },
      skip,
      take: limit,
    });

    const mappedSessions = sessions.map((session) => ({
      id: session.id,
      deviceInfo: session.deviceInfo ?? null,
      ipAddress: session.ipAddress ?? null,
      location: session.location ?? null,
      lastActiveAt: session.lastActiveAt ?? null,
      createdAt: session.createdAt,
      isCurrent: currentSessionId !== undefined && currentSessionId !== null && currentSessionId !== ''
                 ? session.id === currentSessionId 
                 : false,
    }));

    return {
      sessions: mappedSessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Revoke a specific session (logout from that device)
   */
  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (session === null || session === undefined) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Cannot revoke session belonging to another user');
    }

    await this.sessionRepository.update(sessionId, {
      isRevoked: true,
      revokedAt: new Date(),
    });

    this.logger.log(`✅ Session ${sessionId} revoked for user ${userId}`);
  }

  /**
   * Revoke all sessions for a user (logout from all devices)
   * Optionally exclude current session
   */
  async revokeAllSessions(userId: string, excludeSessionId?: string): Promise<number> {
    const query = this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
      })
      .where('userId = :userId', { userId })
      .andWhere('isRevoked = false');

    if (excludeSessionId !== undefined && excludeSessionId !== null && excludeSessionId !== '') {
      query.andWhere('id != :excludeSessionId', { excludeSessionId });
    }

    const result = await query.execute();
    const count = result.affected ?? 0;

    this.logger.log(`✅ Revoked ${count} sessions for user ${userId}`);
    return count;
  }

  /**
   * Revoke session by refresh token (used during logout)
   */
  async revokeByRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.sessionRepository.update(
      { refreshTokenHash: tokenHash },
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
    );
  }

  /**
   * Check if a refresh token is valid (not revoked, not expired)
   */
  async isValidSession(refreshToken: string): Promise<boolean> {
    const session = await this.findByRefreshToken(refreshToken);
    return session !== null;
  }

  /**
   * Cleanup expired sessions (run via cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    const count = result.affected ?? 0;
    if (count > 0) {
      this.logger.log(`🧹 Cleaned up ${count} expired sessions`);
    }

    return count;
  }

  /**
   * Get session count for a user
   */
  async getSessionCount(userId: string): Promise<number> {
    return this.sessionRepository.count({
      where: {
        userId,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  /**
   * Check if a specific session ID is valid (exists, not revoked, not expired, belongs to user)
   */
  async isSessionValid(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
        userId,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });
    return session !== null;
  }
}

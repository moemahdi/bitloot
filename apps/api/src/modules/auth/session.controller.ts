import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SessionService, SessionResponseDto } from './session.service';

/**
 * Authenticated request with user payload
 */
interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

/**
 * Session Controller: Manage user login sessions
 * Enables "Active Sessions" feature in user dashboard
 */
@ApiTags('Sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private readonly sessionService: SessionService) {}

  /**
   * Get all active sessions for current user
   * Used to display "Active Sessions" in dashboard
   * @param currentSessionId Optional session ID to mark as current
   * @param page Page number (1-indexed)
   * @param limit Number of sessions per page
   */
  @Get()
  @ApiOperation({ summary: 'Get all active sessions for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of active sessions with pagination',
  })
  async getActiveSessions(
    @Request() req: AuthenticatedRequest,
    @Query('currentSessionId') currentSessionId?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ): Promise<{ sessions: SessionResponseDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const parsedPage = parseInt(pageStr ?? '1', 10);
    const page = Math.max(1, !isNaN(parsedPage) && parsedPage !== 0 ? parsedPage : 1);
    const parsedLimit = parseInt(limitStr ?? '10', 10);
    const limit = Math.min(50, Math.max(1, !isNaN(parsedLimit) && parsedLimit !== 0 ? parsedLimit : 10));
    
    this.logger.debug(`📋 Fetching sessions for user ${req.user.id}, currentSessionId: ${currentSessionId ?? 'not provided'}, page: ${page}, limit: ${limit}`);
    
    const result = await this.sessionService.getActiveSessionsPaginated(
      req.user.id,
      currentSessionId,
      page,
      limit,
    );

    this.logger.debug(`📋 Found ${result.total} total sessions, returning page ${page} with ${result.sessions.length} items`);

    return result;
  }

  /**
   * Revoke a specific session (logout from that device)
   */
  @Delete(':sessionId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({
    status: 200,
    description: 'Session revoked successfully',
  })
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string }> {
    await this.sessionService.revokeSession(sessionId, req.user.id);

    this.logger.log(`🔒 Session ${sessionId} revoked by user ${req.user.id}`);

    return {
      success: true,
      message: 'Session revoked successfully',
    };
  }

  /**
   * Revoke all sessions except current (logout from all other devices)
   */
  @Delete()
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke all sessions (logout from all devices)' })
  @ApiResponse({
    status: 200,
    description: 'All sessions revoked successfully',
  })
  async revokeAllSessions(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string; revokedCount: number }> {
    // Revoke all sessions (including current - user will need to re-login)
    const revokedCount = await this.sessionService.revokeAllSessions(req.user.id);

    this.logger.log(`🔒 All ${revokedCount} sessions revoked for user ${req.user.id}`);

    return {
      success: true,
      message: `Logged out from ${revokedCount} device(s)`,
      revokedCount,
    };
  }

  /**
   * Get session count for current user
   */
  @Get('count')
  @ApiOperation({ summary: 'Get active session count' })
  @ApiResponse({
    status: 200,
    description: 'Session count',
  })
  async getSessionCount(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ count: number }> {
    const count = await this.sessionService.getSessionCount(req.user.id);
    return { count };
  }

  /**
   * Validate if a specific session ID is still active
   * Used by frontend to check if stored sessionId is stale
   */
  @Get('validate/:sessionId')
  @ApiOperation({ summary: 'Validate if session is still active' })
  @ApiResponse({
    status: 200,
    description: 'Session validation result',
  })
  async validateSession(
    @Param('sessionId') sessionId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ valid: boolean; message: string }> {
    this.logger.debug(`🔍 Validating session ${sessionId} for user ${req.user.id}`);

    const isValid = await this.sessionService.isSessionValid(sessionId, req.user.id);

    if (!isValid) {
      this.logger.warn(`⚠️ Session ${sessionId} is invalid or does not belong to user ${req.user.id}`);
    }

    return {
      valid: isValid,
      message: isValid ? 'Session is active' : 'Session is expired, revoked, or does not exist',
    };
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FeatureFlagsService } from '../admin/feature-flags.service';

/**
 * Public Status Controller
 *
 * Public (no auth) endpoints for checking system status.
 * Used by frontend to check maintenance mode without requiring login.
 */
@ApiTags('Status')
@Controller('status')
export class StatusController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  /**
   * Check if site is in maintenance mode
   *
   * Public endpoint - no authentication required.
   * Frontend polls this to determine if maintenance page should be shown.
   */
  @Get('maintenance')
  @ApiOperation({
    summary: 'Check maintenance mode status',
    description: 'Public endpoint to check if the store is in maintenance mode',
  })
  @ApiResponse({
    status: 200,
    description: 'Maintenance status',
    schema: {
      type: 'object',
      properties: {
        maintenance: { type: 'boolean', description: 'True if in maintenance mode' },
        message: { type: 'string', description: 'Optional message to display' },
      },
    },
  })
  checkMaintenance(): { maintenance: boolean; message: string | null } {
    const isMaintenanceMode = this.featureFlagsService.isEnabled('maintenance_mode');

    return {
      maintenance: isMaintenanceMode,
      message: isMaintenanceMode ? 'BitLoot is currently under maintenance. We\'ll be back soon!' : null,
    };
  }

  /**
   * Basic health/alive check
   *
   * Returns simple status for load balancers and monitoring.
   */
  @Get()
  @ApiOperation({ summary: 'Basic status check' })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  getStatus(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

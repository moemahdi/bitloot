import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Feature Flag operations
 */
export class FeatureFlagDto {
  @ApiProperty({ description: 'Feature flag name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Enable or disable flag' })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ description: 'Description of what the flag does', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO for Queue Statistics response
 */
export class QueueStatsDto {
  @ApiProperty({ description: 'Number of jobs waiting in queue' })
  waiting!: number;

  @ApiProperty({ description: 'Number of jobs currently processing' })
  active!: number;

  @ApiProperty({ description: 'Number of failed jobs' })
  failed!: number;

  @ApiProperty({ description: 'Number of delayed jobs' })
  delayed!: number;

  @ApiProperty({ description: 'Number of paused jobs' })
  paused!: number;

  @ApiProperty({ description: 'Total jobs count' })
  total!: number;
}

/**
 * DTO for Queue Details response
 */
export class QueueDetailDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  stats!: {
    waiting: number;
    active: number;
    failed: number;
    delayed: number;
  };

  @ApiProperty()
  recentJobs!: Array<{
    id: string;
    data: Record<string, unknown>;
    state: string;
    progress: number;
    attempts: number;
  }>;
}

/**
 * DTO for Balance response
 */
export class BalanceDto {
  @ApiProperty({
    properties: {
      available: { type: 'string' },
      currency: { type: 'string' },
      lastUpdated: { type: 'string' },
    },
  })
  nowpayments!: {
    available: string;
    currency: string;
    lastUpdated: string;
  };

  @ApiProperty({
    properties: {
      api_connected: { type: 'boolean' },
      webhooks_enabled: { type: 'boolean' },
      sandbox_mode: { type: 'boolean' },
    },
  })
  status!: {
    api_connected: boolean;
    webhooks_enabled: boolean;
    sandbox_mode: boolean;
  };
}

/**
 * DTO for System Health response
 */
export class SystemHealthDto {
  @ApiProperty({
    properties: {
      healthy: { type: 'boolean' },
      uptime: { type: 'string' },
    },
  })
  api!: { healthy: boolean; uptime: string };

  @ApiProperty({
    properties: {
      healthy: { type: 'boolean' },
      responseTime: { type: 'string' },
    },
  })
  database!: { healthy: boolean; responseTime: string };

  @ApiProperty({
    properties: {
      healthy: { type: 'boolean' },
      responseTime: { type: 'string' },
    },
  })
  redis!: { healthy: boolean; responseTime: string };

  @ApiProperty({
    properties: {
      healthy: { type: 'boolean' },
      failedJobs: { type: 'number' },
    },
  })
  queues!: { healthy: boolean; failedJobs: number };
}

/**
 * DTO for Config Update request
 */
export class ConfigUpdateDto {
  @ApiProperty({ description: 'Config key to update' })
  @IsString()
  key!: string;

  @ApiProperty({ description: 'New config value' })
  value!: string | number | boolean;
}

/**
 * DTO for Config response
 */
export class ConfigResponseDto {
  @ApiProperty({ description: 'Config key' })
  key!: string;

  @ApiProperty({ description: 'Config value' })
  value!: string | number | boolean;

  @ApiProperty({ description: 'Value type' })
  type!: 'string' | 'number' | 'boolean';

  @ApiProperty({ description: 'Description' })
  description!: string;

  @ApiProperty({ description: 'Is this a secret?' })
  isSecret!: boolean;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated!: string;
}

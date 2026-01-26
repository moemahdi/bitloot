import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Supported integration providers
 */
export const ConfigProviders = [
  'nowpayments',
  'kinguin',
  'resend',
  'r2',
  'turnstile',
] as const;

export type ConfigProvider = (typeof ConfigProviders)[number];

/**
 * Environment type
 */
export const ConfigEnvironments = ['sandbox', 'production'] as const;
export type ConfigEnvironment = (typeof ConfigEnvironments)[number];

/**
 * DTO for creating a system config entry
 */
export class CreateSystemConfigDto {
  @ApiProperty({ description: 'Provider name', enum: ConfigProviders })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  provider!: string;

  @ApiProperty({ description: 'Configuration key', example: 'api_key' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  key!: string;

  @ApiProperty({ description: 'Configuration value' })
  @IsString()
  value!: string;

  @ApiPropertyOptional({ description: 'Whether value is a secret (will be encrypted)', default: false })
  @IsOptional()
  @IsBoolean()
  isSecret?: boolean;

  @ApiProperty({ description: 'Environment', enum: ConfigEnvironments, default: 'sandbox' })
  @IsEnum(['sandbox', 'production'])
  environment!: 'sandbox' | 'production';

  @ApiPropertyOptional({ description: 'Human-readable description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Regex validation pattern for the value' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  validationPattern?: string;

  @ApiPropertyOptional({ description: 'Display order for UI grouping', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

/**
 * DTO for updating a system config entry
 */
export class UpdateSystemConfigDto {
  @ApiPropertyOptional({ description: 'New value for the config' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ description: 'Update description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this config is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Update display order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

/**
 * Response DTO for a single system config
 * Note: Secret values are masked
 */
export class SystemConfigResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Provider name' })
  provider!: string;

  @ApiProperty({ description: 'Configuration key' })
  key!: string;

  @ApiProperty({ description: 'Configuration value (masked if secret)' })
  value!: string;

  @ApiProperty({ description: 'Whether value is a secret' })
  isSecret!: boolean;

  @ApiProperty({ description: 'Whether value is set (non-empty)' })
  isSet!: boolean;

  @ApiProperty({ description: 'Environment' })
  environment!: 'sandbox' | 'production';

  @ApiProperty({ description: 'Whether this config is active' })
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Validation pattern' })
  validationPattern?: string;

  @ApiProperty({ description: 'Display order' })
  displayOrder!: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Email of admin who last updated' })
  updatedByEmail?: string;
}

/**
 * Response DTO for provider configuration group
 */
export class ProviderConfigResponseDto {
  @ApiProperty({ description: 'Provider name' })
  provider!: string;

  @ApiProperty({ description: 'Display name for the provider' })
  displayName!: string;

  @ApiProperty({ description: 'Provider description' })
  description!: string;

  @ApiProperty({ description: 'Current active environment' })
  activeEnvironment!: 'sandbox' | 'production';

  @ApiProperty({ type: [SystemConfigResponseDto], description: 'Sandbox configurations' })
  sandbox!: SystemConfigResponseDto[];

  @ApiProperty({ type: [SystemConfigResponseDto], description: 'Production configurations' })
  production!: SystemConfigResponseDto[];

  @ApiProperty({ description: 'Whether all required configs are set' })
  isComplete!: boolean;

  @ApiProperty({ description: 'Missing required config keys' })
  missingKeys!: string[];
}

/**
 * Response DTO for all system configurations
 */
export class ListSystemConfigsResponseDto {
  @ApiProperty({ type: [ProviderConfigResponseDto], description: 'Configs grouped by provider' })
  providers!: ProviderConfigResponseDto[];

  @ApiProperty({ description: 'Global active environment' })
  activeEnvironment!: 'sandbox' | 'production';

  @ApiProperty({ description: 'Total number of config entries' })
  total!: number;
}

/**
 * DTO for switching active environment
 */
export class SwitchEnvironmentDto {
  @ApiProperty({ description: 'Provider to switch (or "all" for global switch)', example: 'nowpayments' })
  @IsString()
  provider!: string;

  @ApiProperty({ description: 'Target environment', enum: ConfigEnvironments })
  @IsEnum(['sandbox', 'production'])
  environment!: 'sandbox' | 'production';
}

/**
 * Response DTO for environment switch result
 */
export class SwitchEnvironmentResponseDto {
  @ApiProperty({ description: 'Operation success' })
  success!: boolean;

  @ApiProperty({ description: 'Result message' })
  message!: string;

  @ApiProperty({ description: 'New active environment' })
  activeEnvironment!: 'sandbox' | 'production';

  @ApiPropertyOptional({ description: 'Affected providers' })
  affectedProviders?: string[];
}

/**
 * Response DTO for config test result
 */
export class TestConfigResponseDto {
  @ApiProperty({ description: 'Provider tested' })
  provider!: string;

  @ApiProperty({ description: 'Environment tested' })
  environment!: 'sandbox' | 'production';

  @ApiProperty({ description: 'Test passed' })
  success!: boolean;

  @ApiProperty({ description: 'Test result message' })
  message!: string;

  @ApiPropertyOptional({ description: 'Response time in ms' })
  responseTimeMs?: number;

  @ApiPropertyOptional({ description: 'Additional details' })
  details?: Record<string, unknown>;
}

/**
 * Provider metadata for display
 */
export const PROVIDER_METADATA: Record<
  string,
  { displayName: string; description: string; requiredKeys: string[] }
> = {
  nowpayments: {
    displayName: 'NOWPayments',
    description: 'Cryptocurrency payment gateway for processing orders',
    requiredKeys: ['api_key', 'ipn_secret', 'base_url', 'callback_url'],
  },
  kinguin: {
    displayName: 'Kinguin',
    description: 'Game key marketplace for product fulfillment',
    requiredKeys: ['api_key', 'base_url'],
  },
  resend: {
    displayName: 'Resend',
    description: 'Email service for transactional and marketing emails',
    requiredKeys: ['api_key', 'from_email'],
  },
  r2: {
    displayName: 'Cloudflare R2',
    description: 'Object storage for encrypted key files',
    requiredKeys: ['account_id', 'access_key_id', 'secret_access_key', 'bucket'],
  },
  turnstile: {
    displayName: 'Cloudflare Turnstile',
    description: 'Bot protection and CAPTCHA for checkout',
    requiredKeys: ['site_key', 'secret_key'],
  },
};

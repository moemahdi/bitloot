import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SystemConfig } from '../../database/entities/system-config.entity';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  SystemConfigResponseDto,
  ProviderConfigResponseDto,
  ListSystemConfigsResponseDto,
  SwitchEnvironmentDto,
  SwitchEnvironmentResponseDto,
  TestConfigResponseDto,
  PROVIDER_METADATA,
} from './dto/system-config.dto';

/**
 * System Config Service
 *
 * Manages API credentials and settings for integrations:
 * - NOWPayments (payments)
 * - Kinguin (fulfillment)
 * - Resend (emails)
 * - Cloudflare R2 (storage)
 * - Cloudflare Turnstile (bot protection)
 *
 * Features:
 * - Encrypted storage for secrets
 * - Sandbox/Production environment switching
 * - Config validation and testing
 * - Fallback to .env variables
 */
@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  // Encryption key derived from JWT_SECRET (32 bytes for AES-256)
  private readonly encryptionKey: Buffer;

  // Cache for active environment configs
  private configCache: Map<string, string> = new Map();
  private activeEnvironment: 'sandbox' | 'production' = 'sandbox';
  private cacheInitialized = false;

  constructor(
    @InjectRepository(SystemConfig)
    private readonly configRepo: Repository<SystemConfig>,
    private readonly envConfig: ConfigService,
  ) {
    // Derive encryption key from JWT_SECRET
    const secret = this.envConfig.get<string>('JWT_SECRET') ?? 'default-secret-change-me';
    this.encryptionKey = crypto.scryptSync(secret, 'bitloot-config-salt', 32);

    // Initialize cache
    void this.refreshCache();
  }

  /**
   * Encrypt a secret value using AES-256-GCM
   */
  private encrypt(plaintext: string): string {
    if (plaintext === '' || plaintext === undefined) return '';

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt a secret value
   */
  private decrypt(ciphertext: string): string {
    if (ciphertext === '' || !ciphertext?.includes(':')) return '';

    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 3) return '';

      const iv = Buffer.from(parts[0] ?? '', 'hex');
      const authTag = Buffer.from(parts[1] ?? '', 'hex');
      const encrypted = parts[2] ?? '';

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt config value', error);
      return '';
    }
  }

  /**
   * Mask a secret value for display
   */
  private maskValue(value: string): string {
    if (value === '' || value === undefined) return '';
    if (value.length <= 8) return '••••••••';
    return value.substring(0, 4) + '••••' + value.substring(value.length - 4);
  }

  /**
   * Refresh config cache from database
   */
  private async refreshCache(): Promise<void> {
    try {
      const configs = await this.configRepo.find({
        where: { isActive: true },
      });

      this.configCache.clear();

      for (const config of configs) {
        const cacheKey = `${config.provider}:${config.key}:${config.environment}`;
        const value = config.isSecret ? this.decrypt(config.value) : config.value;
        this.configCache.set(cacheKey, value);

        // Determine active environment from first config found
        if (!this.cacheInitialized) {
          this.activeEnvironment = config.environment;
        }
      }

      this.cacheInitialized = true;
      this.logger.log(
        `✅ System config cache initialized (${configs.length} entries, env: ${this.activeEnvironment})`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize system config cache', error);
    }
  }

  /**
   * Get a config value (with fallback to .env)
   * Used by other services to get API credentials
   */
  getConfig(provider: string, key: string): string {
    // First check database cache
    const cacheKey = `${provider}:${key}:${this.activeEnvironment}`;
    const cached = this.configCache.get(cacheKey);
    if (cached !== undefined && cached !== '') return cached;

    // Fallback to .env variables
    const envMappings: Record<string, Record<string, string>> = {
      nowpayments: {
        api_key: 'NOWPAYMENTS_API_KEY',
        ipn_secret: 'NOWPAYMENTS_IPN_SECRET',
        base_url: 'NOWPAYMENTS_BASE',
        callback_url: 'NOWPAYMENTS_CALLBACK_URL',
      },
      kinguin: {
        api_key: 'KINGUIN_API_KEY',
        base_url: 'KINGUIN_BASE_URL',
        webhook_secret: 'KINGUIN_WEBHOOK_SECRET',
      },
      resend: {
        api_key: 'RESEND_API_KEY',
        from_email: 'EMAIL_FROM',
      },
      r2: {
        account_id: 'R2_ACCOUNT_ID',
        access_key_id: 'R2_ACCESS_KEY_ID',
        secret_access_key: 'R2_SECRET_ACCESS_KEY',
        bucket: 'R2_BUCKET',
        endpoint: 'R2_ENDPOINT',
      },
      turnstile: {
        site_key: 'TURNSTILE_SITE_KEY',
        secret_key: 'TURNSTILE_SECRET_KEY',
        enabled: 'TURNSTILE_ENABLED',
      },
    };

    const providerMappings = envMappings[provider];
    if (providerMappings !== undefined) {
      const envKey = providerMappings[key];
      if (envKey !== undefined) {
        return this.envConfig.get<string>(envKey) ?? '';
      }
    }

    return '';
  }

  /**
   * Get current active environment
   */
  getActiveEnvironment(): 'sandbox' | 'production' {
    return this.activeEnvironment;
  }

  /**
   * Get all configs grouped by provider
   */
  async findAll(): Promise<ListSystemConfigsResponseDto> {
    const configs = await this.configRepo.find({
      order: { provider: 'ASC', displayOrder: 'ASC' },
      relations: ['updatedBy'],
    });

    const providers: ProviderConfigResponseDto[] = [];
    const providerGroups: Record<string, SystemConfig[]> = {};

    // Group by provider
    for (const config of configs) {
      providerGroups[config.provider] ??= [];
      const providerGroup = providerGroups[config.provider];
      if (providerGroup !== undefined) {
        providerGroup.push(config);
      }
    }

    // Build provider responses
    for (const [provider, providerConfigs] of Object.entries(providerGroups)) {
      const metadata = PROVIDER_METADATA[provider] ?? {
        displayName: provider,
        description: '',
        requiredKeys: [],
      };

      const sandboxConfigs = providerConfigs.filter((c) => c.environment === 'sandbox');
      const prodConfigs = providerConfigs.filter((c) => c.environment === 'production');

      // Check completeness
      const activeConfigs =
        this.activeEnvironment === 'sandbox' ? sandboxConfigs : prodConfigs;
      const missingKeys = metadata.requiredKeys.filter(
        (key) => !activeConfigs.some((c) => c.key === key && this.hasValue(c)),
      );

      providers.push({
        provider,
        displayName: metadata.displayName,
        description: metadata.description,
        activeEnvironment: this.activeEnvironment,
        sandbox: sandboxConfigs.map((c) => this.toResponseDto(c)),
        production: prodConfigs.map((c) => this.toResponseDto(c)),
        isComplete: missingKeys.length === 0,
        missingKeys,
      });
    }

    return {
      providers,
      activeEnvironment: this.activeEnvironment,
      total: configs.length,
    };
  }

  /**
   * Get configs for a specific provider
   */
  async findByProvider(provider: string): Promise<ProviderConfigResponseDto> {
    const configs = await this.configRepo.find({
      where: { provider },
      order: { displayOrder: 'ASC' },
      relations: ['updatedBy'],
    });

    const metadata = PROVIDER_METADATA[provider] ?? {
      displayName: provider,
      description: '',
      requiredKeys: [],
    };

    const sandboxConfigs = configs.filter((c) => c.environment === 'sandbox');
    const prodConfigs = configs.filter((c) => c.environment === 'production');

    const activeConfigs =
      this.activeEnvironment === 'sandbox' ? sandboxConfigs : prodConfigs;
    const missingKeys = metadata.requiredKeys.filter(
      (key) => !activeConfigs.some((c) => c.key === key && this.hasValue(c)),
    );

    return {
      provider,
      displayName: metadata.displayName,
      description: metadata.description,
      activeEnvironment: this.activeEnvironment,
      sandbox: sandboxConfigs.map((c) => this.toResponseDto(c)),
      production: prodConfigs.map((c) => this.toResponseDto(c)),
      isComplete: missingKeys.length === 0,
      missingKeys,
    };
  }

  /**
   * Get a single config by ID
   */
  async findById(id: string): Promise<SystemConfigResponseDto> {
    const config = await this.configRepo.findOne({
      where: { id },
      relations: ['updatedBy'],
    });

    if (config === null) {
      throw new NotFoundException(`Config with ID '${id}' not found`);
    }

    return this.toResponseDto(config);
  }

  /**
   * Create a new config entry
   */
  async create(dto: CreateSystemConfigDto, adminUserId?: string): Promise<SystemConfigResponseDto> {
    // Check for duplicate
    const existing = await this.configRepo.findOne({
      where: { provider: dto.provider, key: dto.key, environment: dto.environment },
    });

    if (existing !== null) {
      throw new ConflictException(
        `Config '${dto.provider}.${dto.key}' already exists for ${dto.environment}`,
      );
    }

    const config = this.configRepo.create({
      provider: dto.provider,
      key: dto.key,
      value: dto.isSecret === true ? this.encrypt(dto.value) : dto.value,
      isSecret: dto.isSecret ?? false,
      environment: dto.environment,
      description: dto.description,
      validationPattern: dto.validationPattern,
      displayOrder: dto.displayOrder ?? 0,
      updatedById: adminUserId,
    });

    const saved = await this.configRepo.save(config);
    this.logger.log(`✅ Config '${dto.provider}.${dto.key}' created (env: ${dto.environment})`);

    await this.refreshCache();

    return this.toResponseDto(saved);
  }

  /**
   * Update a config entry
   */
  async update(
    id: string,
    dto: UpdateSystemConfigDto,
    adminUserId?: string,
  ): Promise<SystemConfigResponseDto> {
    const config = await this.configRepo.findOne({
      where: { id },
      relations: ['updatedBy'],
    });

    if (config === null) {
      throw new NotFoundException(`Config with ID '${id}' not found`);
    }

    // Apply updates
    if (dto.value !== undefined) {
      config.value = config.isSecret ? this.encrypt(dto.value) : dto.value;
    }
    if (dto.description !== undefined) {
      config.description = dto.description;
    }
    if (dto.isActive !== undefined) {
      config.isActive = dto.isActive;
    }
    if (dto.displayOrder !== undefined) {
      config.displayOrder = dto.displayOrder;
    }
    if (adminUserId !== undefined && adminUserId !== '') {
      config.updatedById = adminUserId;
    }

    const saved = await this.configRepo.save(config);
    this.logger.log(`✅ Config '${config.provider}.${config.key}' updated`);

    await this.refreshCache();

    return this.toResponseDto(saved);
  }

  /**
   * Delete a config entry
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const config = await this.configRepo.findOne({ where: { id } });

    if (config === null) {
      throw new NotFoundException(`Config with ID '${id}' not found`);
    }

    await this.configRepo.remove(config);
    this.logger.log(`✅ Config '${config.provider}.${config.key}' deleted`);

    await this.refreshCache();

    return {
      success: true,
      message: `Config '${config.provider}.${config.key}' deleted`,
    };
  }

  /**
   * Switch active environment for a provider or globally
   */
  async switchEnvironment(
    dto: SwitchEnvironmentDto,
    adminUserId?: string,
  ): Promise<SwitchEnvironmentResponseDto> {
    const affectedProviders: string[] = [];

    if (dto.provider === 'all') {
      // Global environment switch
      this.activeEnvironment = dto.environment;
      affectedProviders.push('all');
      this.logger.log(`✅ Global environment switched to ${dto.environment}`);
    } else {
      // Single provider switch (update isActive flags)
      const configs = await this.configRepo.find({
        where: { provider: dto.provider },
      });

      for (const config of configs) {
        config.isActive = config.environment === dto.environment;
        if (adminUserId !== undefined && adminUserId !== '') {
          config.updatedById = adminUserId;
        }
      }

      await this.configRepo.save(configs);
      affectedProviders.push(dto.provider);
      this.logger.log(`✅ ${dto.provider} environment switched to ${dto.environment}`);
    }

    await this.refreshCache();

    return {
      success: true,
      message: `Environment switched to ${dto.environment}`,
      activeEnvironment: dto.environment,
      affectedProviders,
    };
  }

  /**
   * Test a provider's configuration
   */
  async testConfig(provider: string): Promise<TestConfigResponseDto> {
    const start = Date.now();

    try {
      switch (provider) {
        case 'nowpayments':
          return await this.testNowPayments(start);
        case 'kinguin':
          return await this.testKinguin(start);
        case 'resend':
          return await this.testResend(start);
        case 'r2':
          return this.testR2(start);
        case 'turnstile':
          return this.testTurnstile(start);
        default:
          return {
            provider,
            environment: this.activeEnvironment,
            success: false,
            message: `Unknown provider: ${provider}`,
          };
      }
    } catch (error) {
      return {
        provider,
        environment: this.activeEnvironment,
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
        responseTimeMs: Date.now() - start,
      };
    }
  }

  /**
   * Test NOWPayments API
   */
  private async testNowPayments(start: number): Promise<TestConfigResponseDto> {
    const apiKey = this.getConfig('nowpayments', 'api_key');
    const baseUrl = this.getConfig('nowpayments', 'base_url');

    if (apiKey === '' || apiKey === undefined) {
      return {
        provider: 'nowpayments',
        environment: this.activeEnvironment,
        success: false,
        message: 'API key not configured',
        responseTimeMs: Date.now() - start,
      };
    }

    try {
      // Note: baseUrl already includes /v1, so we just append /status
      const response = await fetch(`${baseUrl}/status`, {
        headers: { 'x-api-key': apiKey },
      });

      // Handle non-JSON responses
      const text = await response.text();
      let data: Record<string, unknown> = {};
      
      try {
        data = (text !== '' && text !== undefined) ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        return {
          provider: 'nowpayments',
          environment: this.activeEnvironment,
          success: false,
          message: `Invalid response from API (status ${response.status})`,
          responseTimeMs: Date.now() - start,
          details: { rawResponse: text.substring(0, 200) },
        };
      }

      return {
        provider: 'nowpayments',
        environment: this.activeEnvironment,
        success: response.ok,
        message: response.ok ? 'API connection successful' : `API error: ${response.status}`,
        responseTimeMs: Date.now() - start,
        details: data,
      };
    } catch (error) {
      return {
        provider: 'nowpayments',
        environment: this.activeEnvironment,
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        responseTimeMs: Date.now() - start,
      };
    }
  }

  /**
   * Test Kinguin API
   */
  private async testKinguin(start: number): Promise<TestConfigResponseDto> {
    const apiKey = this.getConfig('kinguin', 'api_key');
    const baseUrl = this.getConfig('kinguin', 'base_url');

    if (apiKey === '' || apiKey === undefined || apiKey === null) {
      return {
        provider: 'kinguin',
        environment: this.activeEnvironment,
        success: false,
        message: 'API key not configured',
        responseTimeMs: Date.now() - start,
      };
    }

    const actualBaseUrl = (baseUrl !== '' && baseUrl !== undefined) ? baseUrl : 'https://gateway.kinguin.net';

    try {
      const response = await fetch(`${actualBaseUrl}/v1/balance`, {
        headers: { 'X-Api-Key': apiKey },
      });

      // Handle non-JSON responses (HTML error pages, etc.)
      const text = await response.text();
      let data: Record<string, unknown> = {};
      
      try {
        data = (text !== undefined && text !== '') ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        // Response is not valid JSON (likely HTML error page)
        return {
          provider: 'kinguin',
          environment: this.activeEnvironment,
          success: false,
          message: `Invalid response from API (status ${response.status})`,
          responseTimeMs: Date.now() - start,
          details: { rawResponse: text.substring(0, 200) },
        };
      }

      return {
        provider: 'kinguin',
        environment: this.activeEnvironment,
        success: response.ok,
        message: response.ok ? 'API connection successful' : `API error: ${response.status}`,
        responseTimeMs: Date.now() - start,
        details: data,
      };
    } catch (error) {
      return {
        provider: 'kinguin',
        environment: this.activeEnvironment,
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        responseTimeMs: Date.now() - start,
      };
    }
  }

  /**
   * Test Resend API
   */
  private async testResend(start: number): Promise<TestConfigResponseDto> {
    // Try database config first, then fall back to .env
    const dbApiKey = this.getConfig('resend', 'api_key');
    const envApiKey = this.envConfig.get<string>('RESEND_API_KEY') ?? '';
    
    // Use database value if set, otherwise use .env directly (same as EmailsService)
    const apiKey = (dbApiKey !== '' && dbApiKey !== undefined) ? dbApiKey : envApiKey;

    // Debug log - show both sources
    const maskedDbKey = (dbApiKey !== '' && dbApiKey !== undefined)
      ? `${dbApiKey.substring(0, 8)}...${dbApiKey.substring(dbApiKey.length - 4)} (len: ${dbApiKey.length})`
      : '(empty)';
    const maskedEnvKey = (envApiKey !== '')
      ? `${envApiKey.substring(0, 8)}...${envApiKey.substring(envApiKey.length - 4)} (len: ${envApiKey.length})`
      : '(empty)';
    this.logger.log(`Testing Resend - DB key: ${maskedDbKey}, ENV key: ${maskedEnvKey}`);

    if (apiKey === '' || apiKey === undefined) {
      return {
        provider: 'resend',
        environment: this.activeEnvironment,
        success: false,
        message: 'API key not configured',
        responseTimeMs: Date.now() - start,
      };
    }

    // Trim whitespace that might have been copied
    const cleanApiKey = apiKey.trim();

    try {
      // Use /domains endpoint - most reliable way to validate API key
      // Use /emails endpoint with GET to list recent emails - works with any valid API key
      const response = await fetch('https://api.resend.com/emails', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${cleanApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Log the actual response for debugging
      this.logger.log(`Resend test response: status=${response.status}`);

      // Parse response safely
      const text = await response.text();
      let data: Record<string, unknown> = {};

      try {
        data = (text !== undefined && text !== '') ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        // JSON parse failed
      }

      if (response.ok) {
        return {
          provider: 'resend',
          environment: this.activeEnvironment,
          success: true,
          message: 'API connection successful',
          responseTimeMs: Date.now() - start,
        };
      }

      // Handle specific error codes
      const errorMessage = (data as { message?: string }).message ?? '';
      
      // Check for restricted API key - this is still valid for sending emails
      if (response.status === 401 && errorMessage.toLowerCase().includes('restricted to only send')) {
        return {
          provider: 'resend',
          environment: this.activeEnvironment,
          success: true,
          message: 'API key valid (send-only permissions)',
          responseTimeMs: Date.now() - start,
        };
      }
      
      const logMessage = errorMessage !== '' ? errorMessage : text.substring(0, 100);
      this.logger.warn(`Resend test failed: ${response.status} - ${logMessage}`);
      
      if (response.status === 401) {
        const authFailMessage = errorMessage !== '' ? errorMessage : 'please verify your API key';
        return {
          provider: 'resend',
          environment: this.activeEnvironment,
          success: false,
          message: `Authentication failed - ${authFailMessage}`,
          responseTimeMs: Date.now() - start,
        };
      }

      return {
        provider: 'resend',
        environment: this.activeEnvironment,
        success: false,
        message: errorMessage ?? `API error: ${response.status}`,
        responseTimeMs: Date.now() - start,
      };
    } catch (error) {
      return {
        provider: 'resend',
        environment: this.activeEnvironment,
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        responseTimeMs: Date.now() - start,
      };
    }
  }

  /**
   * Test R2 connection
   */
  private testR2(start: number): TestConfigResponseDto {
    const accountId = this.getConfig('r2', 'account_id');
    const accessKeyId = this.getConfig('r2', 'access_key_id');

    if (accountId === '' || accountId === undefined || accessKeyId === '' || accessKeyId === undefined) {
      return {
        provider: 'r2',
        environment: this.activeEnvironment,
        success: false,
        message: 'R2 credentials not configured',
        responseTimeMs: Date.now() - start,
      };
    }

    // R2 doesn't have a simple health endpoint, so we just verify config exists
    return {
      provider: 'r2',
      environment: this.activeEnvironment,
      success: true,
      message: 'R2 credentials configured (full test requires S3 SDK)',
      responseTimeMs: Date.now() - start,
    };
  }

  /**
   * Test Turnstile config
   */
  private testTurnstile(start: number): TestConfigResponseDto {
    const siteKey = this.getConfig('turnstile', 'site_key');
    const secretKey = this.getConfig('turnstile', 'secret_key');

    const configured = siteKey !== '' && siteKey !== undefined && secretKey !== '' && secretKey !== undefined;

    return {
      provider: 'turnstile',
      environment: this.activeEnvironment,
      success: configured,
      message: configured ? 'Turnstile credentials configured' : 'Turnstile credentials missing',
      responseTimeMs: Date.now() - start,
    };
  }

  /**
   * Check if config has a non-empty value
   */
  private hasValue(config: SystemConfig): boolean {
    if (config.isSecret) {
      const decrypted = this.decrypt(config.value);
      return decrypted !== '' && decrypted !== undefined && decrypted.length > 0;
    }
    return config.value !== '' && config.value !== undefined && config.value.length > 0;
  }

  /**
   * Convert entity to response DTO (with masked secrets)
   */
  private toResponseDto(config: SystemConfig): SystemConfigResponseDto {
    let displayValue = config.value;
    let isSet = false;

    if (config.isSecret) {
      const decrypted = this.decrypt(config.value);
      isSet = decrypted !== '' && decrypted !== undefined && decrypted.length > 0;
      displayValue = isSet ? this.maskValue(decrypted) : '';
    } else {
      isSet = config.value !== '' && config.value !== undefined && config.value.length > 0;
    }

    return {
      id: config.id,
      provider: config.provider,
      key: config.key,
      value: displayValue,
      isSecret: config.isSecret,
      isSet,
      environment: config.environment,
      isActive: config.isActive,
      description: config.description,
      validationPattern: config.validationPattern,
      displayOrder: config.displayOrder,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      updatedByEmail: config.updatedBy?.email,
    };
  }
}

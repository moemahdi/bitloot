import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { SystemConfigService } from './system-config.service';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  SystemConfigResponseDto,
  ProviderConfigResponseDto,
  ListSystemConfigsResponseDto,
  SwitchEnvironmentDto,
  SwitchEnvironmentResponseDto,
  TestConfigResponseDto,
} from './dto/system-config.dto';

/**
 * System Config Controller
 *
 * Admin endpoints for managing API credentials and settings.
 * Supports sandbox/production environment switching.
 * All endpoints require admin authentication.
 */
@ApiTags('Admin - System Configuration')
@Controller('admin/config')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system configurations grouped by provider' })
  @ApiResponse({
    status: 200,
    description: 'All configurations grouped by provider',
    type: ListSystemConfigsResponseDto,
  })
  async findAll(): Promise<ListSystemConfigsResponseDto> {
    return this.systemConfigService.findAll();
  }

  @Get('provider/:provider')
  @ApiOperation({ summary: 'Get configurations for a specific provider' })
  @ApiParam({ name: 'provider', description: 'Provider name (e.g., nowpayments, kinguin)' })
  @ApiResponse({
    status: 200,
    description: 'Provider configuration with sandbox and production settings',
    type: ProviderConfigResponseDto,
  })
  async findByProvider(@Param('provider') provider: string): Promise<ProviderConfigResponseDto> {
    return this.systemConfigService.findByProvider(provider);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single configuration by ID' })
  @ApiParam({ name: 'id', description: 'Configuration UUID' })
  @ApiResponse({
    status: 200,
    description: 'Configuration details (secrets are masked)',
    type: SystemConfigResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Config not found' })
  async findById(@Param('id') id: string): Promise<SystemConfigResponseDto> {
    return this.systemConfigService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new configuration entry' })
  @ApiResponse({
    status: 201,
    description: 'Configuration created',
    type: SystemConfigResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Config already exists' })
  async create(
    @Body() dto: CreateSystemConfigDto,
    @Request() req: { user: { id: string } },
  ): Promise<SystemConfigResponseDto> {
    return this.systemConfigService.create(dto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a configuration entry' })
  @ApiParam({ name: 'id', description: 'Configuration UUID' })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated',
    type: SystemConfigResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Config not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSystemConfigDto,
    @Request() req: { user: { id: string } },
  ): Promise<SystemConfigResponseDto> {
    return this.systemConfigService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a configuration entry' })
  @ApiParam({ name: 'id', description: 'Configuration UUID' })
  @ApiResponse({
    status: 200,
    description: 'Configuration deleted',
  })
  @ApiResponse({ status: 404, description: 'Config not found' })
  async delete(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.systemConfigService.delete(id);
  }

  @Post('environment')
  @ApiOperation({ summary: 'Switch active environment (sandbox/production)' })
  @ApiResponse({
    status: 200,
    description: 'Environment switched',
    type: SwitchEnvironmentResponseDto,
  })
  async switchEnvironment(
    @Body() dto: SwitchEnvironmentDto,
    @Request() req: { user: { id: string } },
  ): Promise<SwitchEnvironmentResponseDto> {
    return this.systemConfigService.switchEnvironment(dto, req.user.id);
  }

  @Get('environment/current')
  @ApiOperation({ summary: 'Get current active environment' })
  @ApiResponse({
    status: 200,
    description: 'Current environment',
    schema: {
      properties: {
        environment: { type: 'string', enum: ['sandbox', 'production'] },
      },
    },
  })
  getCurrentEnvironment(): { environment: 'sandbox' | 'production' } {
    return { environment: this.systemConfigService.getActiveEnvironment() };
  }

  @Post('test/:provider')
  @ApiOperation({ summary: 'Test a provider configuration' })
  @ApiParam({ name: 'provider', description: 'Provider to test (e.g., nowpayments, kinguin)' })
  @ApiResponse({
    status: 200,
    description: 'Test result',
    type: TestConfigResponseDto,
  })
  async testConfig(@Param('provider') provider: string): Promise<TestConfigResponseDto> {
    return this.systemConfigService.testConfig(provider);
  }

  @Post('test-all')
  @ApiOperation({ summary: 'Test all provider configurations' })
  @ApiResponse({
    status: 200,
    description: 'Test results for all providers',
    type: [TestConfigResponseDto],
  })
  async testAllConfigs(): Promise<TestConfigResponseDto[]> {
    const providers = ['nowpayments', 'kinguin', 'resend', 'r2', 'turnstile'];
    const results: TestConfigResponseDto[] = [];

    for (const provider of providers) {
      const result = await this.systemConfigService.testConfig(provider);
      results.push(result);
    }

    return results;
  }
}

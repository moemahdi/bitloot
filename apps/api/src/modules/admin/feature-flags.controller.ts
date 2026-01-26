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
import { FeatureFlagsService } from './feature-flags.service';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  FeatureFlagResponseDto,
  ListFeatureFlagsResponseDto,
  ToggleFeatureFlagResponseDto,
  GroupedFeatureFlagsResponseDto,
} from './dto/feature-flag.dto';

/**
 * Feature Flags Controller
 *
 * Admin endpoints for managing runtime feature toggles.
 * All endpoints require admin authentication.
 */
@ApiTags('Admin - Feature Flags')
@Controller('admin/feature-flags')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all feature flags' })
  @ApiResponse({
    status: 200,
    description: 'List of all feature flags with counts',
    type: ListFeatureFlagsResponseDto,
  })
  async findAll(): Promise<ListFeatureFlagsResponseDto> {
    return this.featureFlagsService.findAll();
  }

  @Get('grouped')
  @ApiOperation({ summary: 'Get feature flags grouped by category' })
  @ApiResponse({
    status: 200,
    description: 'Flags grouped by category',
    type: GroupedFeatureFlagsResponseDto,
  })
  async findAllGrouped(): Promise<GroupedFeatureFlagsResponseDto> {
    return this.featureFlagsService.findAllGrouped();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get a single feature flag by name' })
  @ApiParam({ name: 'name', description: 'Flag name (snake_case)' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag details',
    type: FeatureFlagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Flag not found' })
  async findByName(@Param('name') name: string): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.findByName(name);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new feature flag' })
  @ApiResponse({
    status: 201,
    description: 'Feature flag created',
    type: FeatureFlagResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Flag already exists' })
  async create(
    @Body() dto: CreateFeatureFlagDto,
    @Request() req: { user: { id: string } },
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.create(dto, req.user.id);
  }

  @Patch(':name')
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiParam({ name: 'name', description: 'Flag name (snake_case)' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag updated',
    type: FeatureFlagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Flag not found' })
  async update(
    @Param('name') name: string,
    @Body() dto: UpdateFeatureFlagDto,
    @Request() req: { user: { id: string } },
  ): Promise<FeatureFlagResponseDto> {
    return this.featureFlagsService.update(name, dto, req.user.id);
  }

  @Patch(':name/toggle')
  @ApiOperation({ summary: 'Toggle a feature flag (enable/disable)' })
  @ApiParam({ name: 'name', description: 'Flag name (snake_case)' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag toggled',
    type: ToggleFeatureFlagResponseDto,
  })
  async toggle(
    @Param('name') name: string,
    @Request() req: { user: { id: string } },
  ): Promise<ToggleFeatureFlagResponseDto> {
    return this.featureFlagsService.toggle(name, req.user.id);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiParam({ name: 'name', description: 'Flag name (snake_case)' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag deleted',
  })
  @ApiResponse({ status: 404, description: 'Flag not found' })
  async delete(
    @Param('name') name: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.featureFlagsService.delete(name);
  }

  @Post('check')
  @ApiOperation({ summary: 'Check multiple feature flags at once' })
  @ApiResponse({
    status: 200,
    description: 'Map of flag names to enabled status',
    schema: {
      type: 'object',
      additionalProperties: { type: 'boolean' },
    },
  })
  async checkFlags(@Body() { names }: { names: string[] }): Promise<Record<string, boolean>> {
    return this.featureFlagsService.checkFlags(names);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AuditLogService } from './audit-log.service';
import {
  CreateAuditLogDto,
  AuditLogQueryDto,
  PaginatedAuditLogsDto,
  AuditLogResponseDto,
} from './dto/audit-log.dto';
import { AuditLog } from '../../database/entities/audit-log.entity';

@ApiTags('Audit Logs')
@Controller('admin/audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create audit log entry' })
  @ApiResponse({ status: 201, type: AuditLogResponseDto })
  async create(@Body() dto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    const log = await this.auditLogService.log(
      dto.adminUserId,
      dto.action,
      dto.target,
      dto.payload,
      dto.details,
    );

    return this.toResponse(log);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Query audit logs with filtering' })
  @ApiResponse({ status: 200, type: PaginatedAuditLogsDto })
  async query(@Query() query: AuditLogQueryDto): Promise<PaginatedAuditLogsDto> {
    const fromDate = query.fromDate != null ? new Date(query.fromDate) : undefined;
    const toDate = query.toDate != null ? new Date(query.toDate) : undefined;

    const result = await this.auditLogService.queryLogs({
      adminUserId: query.adminUserId,
      action: query.action,
      target: query.target,
      fromDate,
      toDate,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      data: result.data.map((log) => this.toResponse(log)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      pages: Math.ceil(result.total / result.limit),
    };
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Export audit logs as JSON' })
  @ApiResponse({ status: 200, type: [AuditLogResponseDto] })
  async export(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<AuditLogResponseDto[]> {
    const from = (fromDate ?? undefined) != null ? new Date(fromDate!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = (toDate ?? undefined) != null ? new Date(toDate!) : new Date();

    const logs = await this.auditLogService.export(from, to);
    return logs.map((log) => this.toResponse(log));
  }

  private toResponse(log: AuditLog): AuditLogResponseDto {
    return {
      id: log.id,
      adminUserId: log.adminUserId,
      admin: log.admin != null ? {
        id: log.admin.id,
        email: log.admin.email,
      } : undefined,
      action: log.action,
      target: log.target,
      payload: log.payload ?? undefined,
      details: log.details ?? undefined,
      createdAt: log.createdAt,
    };
  }
}

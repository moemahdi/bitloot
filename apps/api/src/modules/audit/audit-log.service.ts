import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

export interface AuditLogQuery {
  adminUserId?: string;
  action?: string;
  target?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  data: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(
    adminUserId: string,
    action: string,
    target: string,
    payload?: Record<string, unknown>,
    details?: string,
  ): Promise<AuditLog> {
    const audit = this.auditRepo.create({
      adminUserId,
      action,
      target,
      payload,
      details,
    });
    return this.auditRepo.save(audit);
  }

  async queryLogs(query: AuditLogQuery): Promise<AuditLogResponse> {
    const limit = Math.min(query.limit ?? 50, 100);
    const offset = query.offset ?? 0;

    // Build where conditions with proper typing
    const whereConditions: Array<{ key: string; value: unknown }> = [];

    if (query.adminUserId != null) {
      whereConditions.push({ key: 'adminUserId', value: query.adminUserId });
    }

    if (query.action != null) {
      whereConditions.push({ key: 'action', value: Like(`%${query.action}%`) });
    }

    if (query.target != null) {
      whereConditions.push({ key: 'target', value: Like(`%${query.target}%`) });
    }

    // Build where object from conditions
    const where: Record<string, unknown> = {};
    for (const condition of whereConditions) {
      where[condition.key] = condition.value;
    }

    if (query.fromDate != null || query.toDate != null) {
      where.createdAt = Between(
        query.fromDate ?? new Date(0),
        query.toDate ?? new Date(),
      );
    }

    const [data, total] = await this.auditRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['admin'],
    });

    return { data, total, limit, offset };
  }

  async getLogs(
    adminUserId?: string,
    action?: string,
    target?: string,
    days?: number,
    limit?: number,
    offset?: number,
  ): Promise<AuditLogResponse> {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (days ?? 30));

    return this.queryLogs({
      adminUserId,
      action,
      target,
      fromDate,
      toDate,
      limit,
      offset,
    });
  }

  async export(fromDate: Date, toDate: Date): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: {
        createdAt: Between(fromDate, toDate),
      },
      order: { createdAt: 'DESC' },
      relations: ['admin'],
    });
  }
}

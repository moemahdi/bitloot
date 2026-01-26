import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { type Request } from 'express';
import { AuditLogService } from '../../modules/audit/audit-log.service';
import {
  AUDIT_LOG_KEY,
  type AuditLogMetadata,
} from '../decorators/audit-log.decorator';

/**
 * Fields to always exclude from audit log payloads (security)
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'creditCard',
  'cvv',
  'ssn',
  'otp',
  'code',
];

/**
 * HTTP methods that should be auto-logged if no decorator is present
 */
const AUTO_LOG_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * AuditLogInterceptor
 *
 * Automatically logs admin actions to the audit_logs table.
 * Works in conjunction with @AuditLog decorator for fine-grained control.
 *
 * Auto-logs:
 * - POST, PUT, PATCH, DELETE requests to /admin/* endpoints
 * - Successful responses only (errors are not logged as successful actions)
 *
 * Skip logging:
 * - GET requests (unless explicitly decorated)
 * - Endpoints with @SkipAuditLog decorator
 * - Requests without authenticated admin user
 *
 * @example
 * // Apply globally to admin module
 * @UseInterceptors(AuditLogInterceptor)
 * @Controller('admin')
 * export class AdminController { ... }
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const path = request.path;

    // Get metadata from decorator (if present)
    const metadata = this.reflector.get<AuditLogMetadata | undefined>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    // Check if we should skip
    if (metadata?.skip === true) {
      return next.handle();
    }

    // Get admin user from request
    const user = (request as unknown as Record<string, unknown>).user as
      | { id: string; role?: string; email?: string }
      | undefined;

    // Skip if no user or not admin
    if (user?.role !== 'admin') {
      return next.handle();
    }

    // Determine if we should log this request
    const shouldAutoLog = AUTO_LOG_METHODS.includes(method);
    const hasExplicitDecorator = metadata !== undefined;

    if (!shouldAutoLog && !hasExplicitDecorator) {
      return next.handle();
    }

    // Extract audit data
    const action = this.extractAction(metadata, method, path);
    const target = this.extractTarget(metadata, request);
    const payload = this.extractPayload(metadata, request);
    const details = this.extractDetails(metadata, method, path);

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (_responseData) => {
          const duration = Date.now() - startTime;

          // Log the successful action
          this.auditLogService
            .log(user.id, action, target, {
              ...payload,
              _meta: {
                method,
                path,
                duration,
                responseStatus: 'success',
              },
            }, details)
            .then(() => {
              this.logger.debug(
                `Audit logged: ${action} on ${target} by ${user.email ?? user.id}`,
              );
            })
            .catch((error: Error) => {
              this.logger.error(
                `Failed to log audit: ${error.message}`,
                error.stack,
              );
            });
        },
        error: (error: Error) => {
          // Log failed actions with error info
          const duration = Date.now() - startTime;

          this.auditLogService
            .log(user.id, `${action}.failed`, target, {
              ...payload,
              _meta: {
                method,
                path,
                duration,
                responseStatus: 'error',
                errorMessage: error.message,
              },
            }, `${details ?? 'Action'} failed: ${error.message}`)
            .catch((logError: Error) => {
              this.logger.error(
                `Failed to log audit error: ${logError.message}`,
              );
            });
        },
      }),
    );
  }

  /**
   * Extract action name from metadata or generate from request
   */
  private extractAction(
    metadata: AuditLogMetadata | undefined,
    method: string,
    path: string,
  ): string {
    if (metadata?.action !== undefined && metadata.action !== '') {
      return metadata.action;
    }

    // Generate action from path
    // /admin/orders/:id -> admin.orders.update
    // /admin/flags/:key/toggle -> admin.flags.toggle
    const pathParts = path
      .replace(/^\//, '') // Remove leading slash
      .replace(/\/[0-9a-f-]{36}/gi, '') // Remove UUIDs
      .replace(/\/\d+/g, '') // Remove numeric IDs
      .split('/')
      .filter((part) => part.length > 0);

    const methodAction = this.methodToAction(method);
    return [...pathParts, methodAction].join('.');
  }

  /**
   * Convert HTTP method to action verb
   */
  private methodToAction(method: string): string {
    switch (method) {
      case 'POST':
        return 'create';
      case 'PUT':
        return 'replace';
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return method.toLowerCase();
    }
  }

  /**
   * Extract target from metadata or generate from request
   */
  private extractTarget(
    metadata: AuditLogMetadata | undefined,
    request: Request,
  ): string {
    if (metadata?.target !== undefined && metadata.target !== '') {
      const targetPath = metadata.target;

      // Handle params.xxx
      if (targetPath.startsWith('params.')) {
        const paramName = targetPath.replace('params.', '');
        const paramValue = request.params[paramName] as string | undefined;
        if (paramValue !== undefined) {
          return `${paramName}:${paramValue}`;
        }
      }

      // Handle body.xxx
      if (targetPath.startsWith('body.')) {
        const fieldName = targetPath.replace('body.', '');
        const body = request.body as Record<string, unknown> | undefined;
        const fieldValue = body?.[fieldName];
        if (fieldValue !== undefined) {
          // Handle null, objects, and primitives safely
          let stringValue: string;
          if (fieldValue === null) {
            stringValue = 'null';
          } else if (typeof fieldValue === 'object') {
            stringValue = JSON.stringify(fieldValue);
          } else {
            stringValue = String(fieldValue as string | number | boolean);
          }
          return `${fieldName}:${stringValue}`;
        }
      }

      // Static target
      return targetPath;
    }

    // Generate from route params
    const params = request.params as Record<string, string>;
    const paramEntries = Object.entries(params);

    if (paramEntries.length > 0) {
      // Use first param as target (usually :id)
      const [paramName, paramValue] = paramEntries[0] as [string, string];
      return `${paramName}:${paramValue}`;
    }

    // Fallback to path
    return request.path;
  }

  /**
   * Extract and sanitize payload from request body
   */
  private extractPayload(
    metadata: AuditLogMetadata | undefined,
    request: Request,
  ): Record<string, unknown> {
    const body = request.body as Record<string, unknown> | undefined;

    if (body === undefined || body === null || Object.keys(body).length === 0) {
      return {};
    }

    let payload: Record<string, unknown>;

    // If specific fields are requested
    if (metadata?.includeBodyFields !== undefined && metadata.includeBodyFields.length > 0) {
      payload = {};
      for (const field of metadata.includeBodyFields) {
        if (field in body) {
          payload[field] = body[field];
        }
      }
    } else {
      // Include all fields
      payload = { ...body };
    }

    // Remove excluded fields
    const excludeFields = [
      ...SENSITIVE_FIELDS,
      ...(metadata?.excludeBodyFields ?? []),
    ];

    for (const field of excludeFields) {
      if (field in payload) {
        payload[field] = '[REDACTED]';
      }
    }

    // Limit payload size (prevent storing huge payloads)
    const payloadStr = JSON.stringify(payload);
    if (payloadStr.length > 10000) {
      return {
        _truncated: true,
        _originalSize: payloadStr.length,
        ...Object.fromEntries(
          Object.entries(payload).slice(0, 10),
        ),
      };
    }

    return payload;
  }

  /**
   * Extract details message
   */
  private extractDetails(
    metadata: AuditLogMetadata | undefined,
    method: string,
    path: string,
  ): string | undefined {
    if (metadata?.details !== undefined && metadata.details !== '') {
      return metadata.details;
    }

    // Generate default details
    const action = this.methodToAction(method);
    const resource = path.split('/').filter(Boolean).slice(-1)[0] ?? 'resource';

    return `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`;
  }
}

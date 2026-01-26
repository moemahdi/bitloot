import { SetMetadata } from '@nestjs/common';

/**
 * Audit Log Metadata Interface
 *
 * Defines the structure for audit log configuration
 */
export interface AuditLogMetadata {
  /**
   * Action name for the audit log
   * Examples: 'order.status.update', 'product.create', 'flag.toggle'
   */
  action: string;

  /**
   * How to extract the target from the request
   * - 'params.id' - Use route param :id
   * - 'params.orderId' - Use route param :orderId
   * - 'body.productId' - Use body field
   * - Static string like 'system:config'
   */
  target?: string;

  /**
   * Fields to include in the payload from request body
   * If not specified, entire body is included (sanitized)
   */
  includeBodyFields?: string[];

  /**
   * Fields to exclude from the payload
   * Useful for sensitive data like passwords
   */
  excludeBodyFields?: string[];

  /**
   * Custom details message or function to generate it
   */
  details?: string;

  /**
   * Skip audit logging for this endpoint (useful for reads)
   * Default: false
   */
  skip?: boolean;
}

export const AUDIT_LOG_KEY = 'audit_log';

/**
 * Decorator to configure audit logging for admin endpoints
 *
 * @example
 * // Basic usage
 * @AuditLog({ action: 'order.status.update', target: 'params.id' })
 *
 * // With specific body fields
 * @AuditLog({
 *   action: 'product.price.update',
 *   target: 'params.slug',
 *   includeBodyFields: ['price', 'currency'],
 *   details: 'Price updated'
 * })
 *
 * // Skip audit logging
 * @AuditLog({ skip: true })
 */
export const AuditLog = (metadata: AuditLogMetadata): MethodDecorator =>
  SetMetadata(AUDIT_LOG_KEY, metadata);

/**
 * Decorator to skip audit logging for specific endpoints
 * Shorthand for @AuditLog({ skip: true })
 */
export const SkipAuditLog = (): MethodDecorator =>
  SetMetadata(AUDIT_LOG_KEY, { action: '', skip: true } as AuditLogMetadata);

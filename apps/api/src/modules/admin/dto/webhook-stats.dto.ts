import { ApiProperty } from '@nestjs/swagger';

/**
 * Webhook statistics by type
 */
export class WebhookStatsByTypeDto {
  @ApiProperty({ description: 'Webhook type identifier', example: 'nowpayments_ipn' })
  type!: string;

  @ApiProperty({ description: 'Count of webhooks of this type', example: 150 })
  count!: number;
}

/**
 * Webhook statistics by status
 */
export class WebhookStatsByStatusDto {
  @ApiProperty({ description: 'Payment status', example: 'finished' })
  status!: string;

  @ApiProperty({ description: 'Count of webhooks with this status', example: 120 })
  count!: number;
}

/**
 * Webhook statistics response DTO
 */
export class WebhookStatsDto {
  @ApiProperty({ description: 'Total number of webhooks in period', example: 500 })
  total!: number;

  @ApiProperty({ description: 'Number of processed webhooks', example: 450 })
  processed!: number;

  @ApiProperty({ description: 'Number of pending webhooks', example: 25 })
  pending!: number;

  @ApiProperty({ description: 'Number of failed webhooks (with errors)', example: 15 })
  failed!: number;

  @ApiProperty({ description: 'Number of webhooks with invalid signatures', example: 5 })
  invalidSignature!: number;

  @ApiProperty({ description: 'Number of duplicate webhooks', example: 5 })
  duplicates!: number;

  @ApiProperty({ description: 'Success rate as percentage (0-100)', example: 90.5 })
  successRate!: number;

  @ApiProperty({ description: 'Breakdown by webhook type', type: [WebhookStatsByTypeDto] })
  byType!: WebhookStatsByTypeDto[];

  @ApiProperty({ description: 'Breakdown by payment status', type: [WebhookStatsByStatusDto] })
  byStatus!: WebhookStatsByStatusDto[];

  @ApiProperty({ description: 'Period start date', example: '2026-01-07T00:00:00.000Z' })
  periodStart!: string;

  @ApiProperty({ description: 'Period end date', example: '2026-01-14T23:59:59.999Z' })
  periodEnd!: string;
}

/**
 * Timeline data point for webhook activity
 */
export class WebhookTimelinePointDto {
  @ApiProperty({ description: 'Timestamp for this data point', example: '2026-01-14T10:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ description: 'Total webhooks in this interval', example: 50 })
  total!: number;

  @ApiProperty({ description: 'Processed webhooks in this interval', example: 45 })
  processed!: number;

  @ApiProperty({ description: 'Failed webhooks in this interval', example: 3 })
  failed!: number;

  @ApiProperty({ description: 'Invalid signature webhooks in this interval', example: 2 })
  invalidSig!: number;
}

/**
 * Webhook activity timeline response DTO
 */
export class WebhookTimelineDto {
  @ApiProperty({ description: 'Timeline data points', type: [WebhookTimelinePointDto] })
  data!: WebhookTimelinePointDto[];

  @ApiProperty({ description: 'Time interval used', enum: ['hour', 'day'], example: 'hour' })
  interval!: 'hour' | 'day';

  @ApiProperty({ description: 'Period analyzed', enum: ['24h', '7d', '30d'], example: '7d' })
  period!: '24h' | '7d' | '30d';
}

/**
 * Adjacent webhook navigation response
 */
export class WebhookAdjacentDto {
  @ApiProperty({ description: 'Previous webhook ID', required: false, example: 'abc123-def456' })
  previous?: string;

  @ApiProperty({ description: 'Next webhook ID', required: false, example: 'xyz789-uvw012' })
  next?: string;
}

/**
 * Bulk replay request DTO
 */
export class BulkReplayWebhooksDto {
  @ApiProperty({ 
    description: 'Array of webhook log IDs to replay', 
    type: [String],
    example: ['abc123', 'def456', 'ghi789']
  })
  ids!: string[];
}

/**
 * Bulk replay error item
 */
export class BulkReplayErrorDto {
  @ApiProperty({ description: 'Webhook ID that failed', example: 'abc123' })
  id!: string;

  @ApiProperty({ description: 'Error message', example: 'Cannot replay already processed webhook' })
  error!: string;
}

/**
 * Bulk replay response DTO
 */
export class BulkReplayResponseDto {
  @ApiProperty({ description: 'Number of webhooks successfully marked for replay', example: 3 })
  replayed!: number;

  @ApiProperty({ description: 'Number of webhooks that failed to replay', example: 1 })
  failed!: number;

  @ApiProperty({ description: 'Details of failed replays', type: [BulkReplayErrorDto] })
  errors!: BulkReplayErrorDto[];
}

/**
 * Enhanced webhook log response for list view
 */
export class WebhookLogListItemDto {
  @ApiProperty({ description: 'Webhook log ID' })
  id!: string;

  @ApiProperty({ description: 'External webhook ID (e.g., payment_id)' })
  externalId!: string;

  @ApiProperty({ description: 'Webhook type identifier' })
  webhookType!: string;

  @ApiProperty({ description: 'Payment status from payload' })
  paymentStatus!: string;

  @ApiProperty({ description: 'Whether webhook was processed' })
  processed!: boolean;

  @ApiProperty({ description: 'Whether signature was valid' })
  signatureValid!: boolean;

  @ApiProperty({ description: 'Associated order ID', required: false })
  orderId?: string;

  @ApiProperty({ description: 'Associated payment ID', required: false })
  paymentId?: string;

  @ApiProperty({ description: 'Error message if processing failed', required: false })
  error?: string;

  @ApiProperty({ description: 'Source IP address', required: false })
  sourceIp?: string;

  @ApiProperty({ description: 'Number of processing attempts' })
  attemptCount!: number;

  @ApiProperty({ description: 'When webhook was received' })
  createdAt!: Date;

  @ApiProperty({ description: 'When webhook was last updated' })
  updatedAt!: Date;
}

/**
 * Paginated webhook logs response
 */
export class PaginatedWebhookLogsDto {
  @ApiProperty({ description: 'List of webhook logs', type: [WebhookLogListItemDto] })
  data!: WebhookLogListItemDto[];

  @ApiProperty({ description: 'Total number of matching logs', example: 500 })
  total!: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages', example: 25 })
  totalPages!: number;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  hasNextPage!: boolean;
}

/**
 * Full webhook log details for detail view
 */
export class WebhookLogDetailDto {
  @ApiProperty({ description: 'Webhook log ID' })
  id!: string;

  @ApiProperty({ description: 'External webhook ID' })
  externalId!: string;

  @ApiProperty({ description: 'Webhook type identifier' })
  webhookType!: string;

  @ApiProperty({ description: 'Payment status from payload' })
  paymentStatus!: string;

  @ApiProperty({ description: 'Raw webhook payload', type: 'object' })
  payload!: Record<string, unknown>;

  @ApiProperty({ description: 'Whether signature was valid' })
  signatureValid!: boolean;

  @ApiProperty({ description: 'Whether webhook was processed' })
  processed!: boolean;

  @ApiProperty({ description: 'Associated order ID', required: false })
  orderId?: string;

  @ApiProperty({ description: 'Associated payment ID', required: false })
  paymentId?: string;

  @ApiProperty({ description: 'Processing result', type: 'object', required: false })
  result?: Record<string, unknown>;

  @ApiProperty({ description: 'Error message if processing failed', required: false })
  error?: string;

  @ApiProperty({ description: 'Source IP address', required: false })
  sourceIp?: string;

  @ApiProperty({ description: 'Number of processing attempts' })
  attemptCount!: number;

  @ApiProperty({ description: 'When webhook was received' })
  createdAt!: Date;

  @ApiProperty({ description: 'When webhook was last updated' })
  updatedAt!: Date;
}

/**
 * Order webhook history item
 */
export class OrderWebhookHistoryItemDto {
  @ApiProperty({ description: 'Webhook log ID' })
  id!: string;

  @ApiProperty({ description: 'External webhook ID' })
  externalId!: string;

  @ApiProperty({ description: 'Webhook type' })
  webhookType!: string;

  @ApiProperty({ description: 'Payment status' })
  paymentStatus!: string;

  @ApiProperty({ description: 'Whether processed' })
  processed!: boolean;

  @ApiProperty({ description: 'Whether signature valid' })
  signatureValid!: boolean;

  @ApiProperty({ description: 'Error if any', required: false })
  error?: string;

  @ApiProperty({ description: 'When received' })
  createdAt!: Date;
}

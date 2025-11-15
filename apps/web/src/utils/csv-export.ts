/**
 * CSV export utilities for admin data tables
 */

export interface CSVRow {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Convert array of objects to CSV string
 * Handles quoted fields, escaping, and proper formatting
 */
export function convertToCSV<T extends CSVRow>(data: T[], columns: string[]): string {
  // Create header row
  const headers = columns.map((col) => `"${col.replace(/"/g, '""')}"`).join(',');

  // Create data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col];
        // Handle null/undefined
        if (value == null) return '';
        // Quote and escape strings
        const str = String(value);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  return [headers, ...rows].join('\n');
}

/**
 * Download CSV data as file
 */
export function downloadCSV(csv: string, filename: string = 'export.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export orders data to CSV
 */
export interface OrderExportRow extends CSVRow {
  'Order ID': string;
  Email: string;
  Status: string;
  Total: string;
  'Created At': string;
}

export function exportOrdersToCSV(
  orders: Array<{
    id: string;
    email: string;
    status: string;
    total: string;
    createdAt: string;
  }>
): void {
  const data: OrderExportRow[] = orders.map((order) => ({
    'Order ID': order.id,
    Email: order.email,
    Status: order.status,
    Total: order.total,
    'Created At': order.createdAt,
  }));

  const columns = ['Order ID', 'Email', 'Status', 'Total', 'Created At'];
  const csv = convertToCSV(data, columns);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `bitloot-orders-${timestamp}.csv`);
}

/**
 * Export payments data to CSV
 */
export interface PaymentExportRow extends CSVRow {
  'Payment ID': string;
  'Order ID': string;
  Amount: string;
  Status: string;
  'Created At': string;
}

export function exportPaymentsToCSV(
  payments: Array<{
    id: string;
    orderId: string;
    amount: string;
    status: string;
    createdAt: string;
  }>
): void {
  const data: PaymentExportRow[] = payments.map((payment) => ({
    'Payment ID': payment.id,
    'Order ID': payment.orderId,
    Amount: payment.amount,
    Status: payment.status,
    'Created At': payment.createdAt,
  }));

  const columns = ['Payment ID', 'Order ID', 'Amount', 'Status', 'Created At'];
  const csv = convertToCSV(data, columns);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `bitloot-payments-${timestamp}.csv`);
}

/**
 * Export webhooks data to CSV
 */
export interface WebhookExportRow extends CSVRow {
  'Webhook ID': string;
  Type: string;
  Status: string;
  Processed: string;
  'Created At': string;
}

export function exportWebhooksToCSV(
  webhooks: Array<{
    id: string;
    type: string;
    status: string;
    processed: boolean;
    createdAt: string;
  }>
): void {
  const data: WebhookExportRow[] = webhooks.map((webhook) => ({
    'Webhook ID': webhook.id,
    Type: webhook.type,
    Status: webhook.status,
    Processed: webhook.processed ? 'Yes' : 'No',
    'Created At': webhook.createdAt,
  }));

  const columns = ['Webhook ID', 'Type', 'Status', 'Processed', 'Created At'];
  const csv = convertToCSV(data, columns);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `bitloot-webhooks-${timestamp}.csv`);
}

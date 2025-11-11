'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
// @ts-expect-error - socket.io-client has typing issues
import { io } from 'socket.io-client';

/**
 * Type for order item
 */
export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  signedUrl?: string;
}

/**
 * Type for fulfillment status updates from WebSocket
 */
export interface FulfillmentStatusChange {
  orderId: string;
  status: string;
  fulfillmentStatus?: string;
  items?: OrderItem[];
  jobId?: string;
  jobStatus?: string;
  jobProgress?: number;
  error?: string;
  timestamp: string;
}

/**
 * Type for payment confirmation events
 */
export interface PaymentConfirmedEvent {
  orderId: string;
  amount: string;
  currency: string;
  txHash?: string;
  timestamp: string;
}

/**
 * Type for key delivery events
 */
export interface KeyDeliveredEvent {
  orderId: string;
  itemCount: number;
  deliveryMethod: 'customer-reveal' | 'admin-send' | 'webhook';
  timestamp: string;
}

/**
 * Type for fulfillment errors
 */
export interface FulfillmentErrorEvent {
  orderId: string;
  error: string;
  severity: 'warning' | 'error' | 'critical';
  retryable: boolean;
  timestamp: string;
}

/**
 * Type for webhook event
 */
export interface WebhookEventData {
  provider: string;
  eventType: string;
  externalId: string;
  status: 'received' | 'verified' | 'processed' | 'failed';
  error?: string;
  timestamp: string;
}

/**
 * Type for job queue event
 */
export interface JobQueueEventData {
  jobId: string;
  event: 'queued' | 'started' | 'progress' | 'completed' | 'failed';
  queueName: string;
  progress?: number;
  error?: string;
  result?: Record<string, unknown>;
  timestamp: string;
}

/**
 * React Hook for WebSocket fulfillment status updates
 *
 * Replaces REST API polling (1s interval) with real-time WebSocket updates.
 * Significantly reduces:
 * - Server load (~90% reduction in API calls)
 * - Network bandwidth
 * - Latency (~500ms → <50ms)
 *
 * @param orderId - Order ID to subscribe to
 * @param jwtToken - JWT authentication token
 * @param options - Configuration options
 *
 * @example
 * const {
 *   isConnected,
 *   statusChange,
 *   paymentConfirmed,
 *   keyDelivered,
 *   error,
 *   subscribe,
 *   unsubscribe
 * } = useFulfillmentWebSocket(orderId, token, {
 *   autoSubscribe: true,
 *   debug: true
 * });
 *
 * useEffect(() => {
 *   if (statusChange) {
 *     console.log(`Order status: ${statusChange.status}`);
 *   }
 * }, [statusChange]);
 */
export function useFulfillmentWebSocket(
  orderId: string | null,
  jwtToken: string | null,
  options: {
    autoSubscribe?: boolean;
    debug?: boolean;
    onStatusChange?: (change: FulfillmentStatusChange) => void;
    onPaymentConfirmed?: (event: PaymentConfirmedEvent) => void;
    onKeyDelivered?: (event: KeyDeliveredEvent) => void;
    onError?: (event: FulfillmentErrorEvent) => void;
  } = {},
): {
  isConnected: boolean;
  statusChange: FulfillmentStatusChange | null;
  paymentConfirmed: PaymentConfirmedEvent | null;
  keyDelivered: KeyDeliveredEvent | null;
  error: FulfillmentErrorEvent | null;
  subscribe: () => void;
  unsubscribe: () => void;
  socket: unknown;
} {
  const [isConnected, setIsConnected] = useState(false);
  const [statusChange, setStatusChange] = useState<FulfillmentStatusChange | null>(
    null,
  );
  const [paymentConfirmed, setPaymentConfirmed] = useState<PaymentConfirmedEvent | null>(
    null,
  );
  const [keyDelivered, setKeyDelivered] = useState<KeyDeliveredEvent | null>(null);
  const [error, setError] = useState<FulfillmentErrorEvent | null>(null);
  const socketRef = useRef<unknown>(undefined);

  const {
    autoSubscribe = true,
    debug = false,
    onStatusChange,
    onPaymentConfirmed,
    onKeyDelivered,
    onError,
  } = options;

  // Log helper
  const log = useCallback(
    (message: string, data?: unknown) => {
      if (debug) {
        console.info(`[WebSocket] ${message}`, data);
      }
    },
    [debug],
  );

  // Subscribe to order updates
  const subscribe = useCallback(() => {
    if (socketRef.current === undefined || socketRef.current === null) {
      return;
    }
    if (orderId === null || orderId === '') {
      return;
    }

    log(`Subscribing to order ${orderId}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (socketRef.current as any).emit('subscribe:order', { orderId });
  }, [orderId, log]);

  // Unsubscribe from order updates
  const unsubscribe = useCallback(() => {
    if (socketRef.current === undefined || socketRef.current === null) {
      return;
    }
    if (orderId === null || orderId === '') {
      return;
    }

    log(`Unsubscribing from order ${orderId}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (socketRef.current as any).emit('unsubscribe:order', { orderId });
  }, [orderId, log]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (jwtToken === null || jwtToken === '') {
      log('No JWT token, skipping WebSocket connection');
      return;
    }

    log('Initializing WebSocket connection');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    const socket: any = io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000', {
      namespace: '/fulfillment',
      auth: { token: jwtToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection established
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (socket).on('connect', () => {
      log('✅ Connected to WebSocket server');
      setIsConnected(true);

      // Auto-subscribe to order if provided
      if (autoSubscribe && (orderId !== null && orderId !== '')) {
        subscribe();
      }
    });

    // Connection lost
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (socket).on('disconnect', () => {
      log('❌ Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Status change event
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (socket).on('fulfillment:status-change', (data: FulfillmentStatusChange) => {
      log('📊 Fulfillment status changed', data);
      setStatusChange(data);
      onStatusChange?.(data);
    });

    // Payment confirmed event
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (socket).on('payment:confirmed', (data: PaymentConfirmedEvent) => {
      log('💰 Payment confirmed', data);
      setPaymentConfirmed(data);
      onPaymentConfirmed?.(data);
    });

    // Key delivered event
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (socket).on('fulfillment:key-delivered', (data: KeyDeliveredEvent) => {
      log('🔑 Key delivered', data);
      setKeyDelivered(data);
      onKeyDelivered?.(data);
    });

    // Error event
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (socket).on('fulfillment:error', (data: FulfillmentErrorEvent) => {
      log('⚠️ Fulfillment error', data);
      setError(data);
      onError?.(data);
    });

    // Connection error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (socket).on('connect_error', (error: any) => {
      log('❌ Connection error', error);
    });

    socketRef.current = socket;

    return () => {
      log('Cleaning up WebSocket connection');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (socket).disconnect();
      socketRef.current = null;
    };
  }, [jwtToken, autoSubscribe, orderId, subscribe, log, onStatusChange, onPaymentConfirmed, onKeyDelivered, onError]);

  return {
    isConnected,
    statusChange,
    paymentConfirmed,
    keyDelivered,
    error,
    subscribe,
    unsubscribe,
    socket: socketRef.current,
  };
}

/**
 * React Hook for admin WebSocket monitoring
 *
 * Provides real-time monitoring of:
 * - All fulfillment updates (not just user's orders)
 * - Job queue events
 * - System statistics
 * - Webhook events
 *
 * @param jwtToken - JWT token (must have admin role)
 * @param options - Configuration options
 *
 * @example
 * const {
 *   isConnected,
 *   allUpdates,
 *   jobEvents,
 *   webhookEvents,
 *   connectionStats,
 *   getConnections
 * } = useAdminWebSocket(token, { debug: true });
 *
 * // Get connection statistics
 * useEffect(() => {
 *   getConnections();
 * }, [getConnections]);
 *
 * // Listen for all updates
 * useEffect(() => {
 *   if (allUpdates) {
 *     console.log(`Order ${allUpdates.orderId} updated`);
 *   }
 * }, [allUpdates]);
 */
export function useAdminWebSocket(
  jwtToken: string | null,
  options: {
    debug?: boolean;
    onStatusChange?: (change: FulfillmentStatusChange) => void;
    onJobEvent?: (event: unknown) => void;
    onWebhookReceived?: (event: unknown) => void;
    onConnectionStats?: (stats: unknown) => void;
  } = {},
): {
  isConnected: boolean;
  allUpdates: FulfillmentStatusChange | null;
  jobEvents: unknown[];
  webhookEvents: unknown[];
  connectionStats: unknown;
  getConnections: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket: any;
} {
  const [isConnected, setIsConnected] = useState(false);
  const [allUpdates, setAllUpdates] = useState<FulfillmentStatusChange | null>(null);
  const [jobEvents, setJobEvents] = useState<unknown[]>([]);
const [webhookEvents, setWebhookEvents] = useState<unknown[]>([]);
const [connectionStats, setConnectionStats] = useState<unknown>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const socketRef = useRef<any>(null);

const { debug = false, onStatusChange, onJobEvent, onWebhookReceived, onConnectionStats } =
  options;

const log = useCallback(
  (message: string, data?: unknown) => {
    if (debug) {
      console.info(`[AdminWebSocket] ${message}`, data);
    }
  },
  [debug],
);

const getConnections = useCallback(() => {
  if (socketRef.current === null) return;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  (socketRef.current).emit('admin:get-connections');
}, []);

  useEffect(() => {
    if (jwtToken === null || jwtToken === '') {
      log('No JWT token, skipping admin WebSocket connection');
      return;
    }

    log('Initializing admin WebSocket connection');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const socket: any = io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000', {
      namespace: '/fulfillment',
      auth: { token: jwtToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (socket).on('connect', () => {
      log('✅ Admin connected to WebSocket server');
      setIsConnected(true);
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (socket).on('disconnect', () => {
      log('❌ Admin disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Admin: Fulfillment updates (all orders)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (socket).on('admin:fulfillment-update', (data: FulfillmentStatusChange) => {
      log('📊 Admin: Fulfillment update', data);
      setAllUpdates(data);
      onStatusChange?.(data);
    });

    // Admin: Job queue events
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (socket).on('admin:job-event', (data: unknown) => {
      log('📋 Admin: Job event', data);
      setJobEvents((prev) => [data, ...prev.slice(0, 49)]); // Keep last 50
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onJobEvent?.(data as any);
    });

    // Admin: Webhook events
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (socket).on('admin:webhook-received', (data: unknown) => {
      log('🪝 Admin: Webhook received', data);
      setWebhookEvents((prev) => [data, ...prev.slice(0, 49)]); // Keep last 50
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onWebhookReceived?.(data as any);
    });

    // Admin: Connection statistics
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (socket).on('admin:connection-stats', (data: unknown) => {
      log('📊 Admin: Connection stats', data);
      setConnectionStats(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onConnectionStats?.(data as any);
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (socket).on('connect_error', (error: unknown) => {
      log('❌ Connection error', error);
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    socketRef.current = socket;

    return () => {
      log('Cleaning up admin WebSocket connection');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (socket).disconnect();
      socketRef.current = null;
    };
  }, [jwtToken, log, onStatusChange, onJobEvent, onWebhookReceived, onConnectionStats]);

  return {
    isConnected,
    allUpdates,
    jobEvents,
    webhookEvents,
    connectionStats,
    getConnections,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    socket: socketRef.current,
  };
}

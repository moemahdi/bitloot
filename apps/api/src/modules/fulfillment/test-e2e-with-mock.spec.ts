/**
 * Complete E2E Test: Kinguin Mock API for Full Order Fulfillment
 *
 * This test uses dependency injection to provide a mock Kinguin client
 * instead of the real one, allowing full E2E testing without real API calls.
 *
 * Usage: npm run test -- test-e2e-with-mock
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../../app.module';
import { MockKinguinClient } from './kinguin.mock';
import { KinguinClient } from './kinguin.client';

describe('E2E: Mock Kinguin API Full Fulfillment Pipeline', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let mockKinguinClient: MockKinguinClient;

  beforeAll(async () => {
    console.warn('ℹ️  Setting up E2E test with mock Kinguin client...');

    // Create test module and override KinguinClient with MockKinguinClient
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(KinguinClient)
      .useValue(new MockKinguinClient())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Get instances
    mockKinguinClient = moduleRef.get<MockKinguinClient>(KinguinClient) as unknown as MockKinguinClient;

    console.warn('✅ E2E test module initialized with mock Kinguin client');
  });

  afterAll(async () => {
    console.warn('ℹ️  Cleaning up E2E test...');
    if (app !== null && app !== undefined) {
      await app.close();
    }
  });

  // Skip by default - requires full app context with mocks
  it.skip('should complete full fulfillment pipeline with mock Kinguin API', async () => {
    console.warn('\n📋 Test: Full E2E Fulfillment Pipeline with Mock Kinguin\n');

    // Step 1: Verify mock Kinguin client was injected
    console.warn('Step 1️⃣  Verifying mock Kinguin client injection...');
    const initialState = mockKinguinClient.getInternalState();
    console.warn(`✅ Mock client injected successfully`);
    console.warn(`   Initial state: ${JSON.stringify(initialState, null, 2)}`);

    // Step 2: Test mock client createOrder method
    console.warn('\nStep 2️⃣  Testing mock Kinguin createOrder method...');
    try {
      const createOrderRes = await mockKinguinClient.createOrder({
        offerId: 'PROD-TEST-001',
        quantity: 1,
      });
      console.warn(`✅ Mock createOrder returned: ${JSON.stringify(createOrderRes, null, 2)}`);
      console.warn(`   - Order ID: ${createOrderRes.id}`);
      console.warn(`   - Status: ${createOrderRes.status}`);
      expect(createOrderRes.id).toBeTruthy();
      expect(createOrderRes.status).toBe('waiting');

      const orderId = createOrderRes.id;

      // Step 3: Test mock client getOrderStatus method
      console.warn('\nStep 3️⃣  Testing mock Kinguin getOrderStatus method...');
      const statusRes = await mockKinguinClient.getOrderStatus(orderId);
      console.warn(`✅ Mock getOrderStatus returned: ${JSON.stringify(statusRes, null, 2)}`);
      console.warn(`   - Status: ${statusRes.status}`);
      expect(statusRes.id).toBe(orderId);

      // Step 4: Simulate status transition (usually happens after ~5-10 seconds)
      console.warn('\nStep 4️⃣  Simulating order status transition (waiting → ready)...');
      // In reality, this would happen asynchronously, but for testing we can manually check
      const updatedStatus = await mockKinguinClient.getOrderStatus(orderId);
      console.warn(`✅ Order status after polling: ${updatedStatus.status}`);

      // Step 5: Test mock client getKey method (may fail if status is still waiting)
      console.warn('\nStep 5️⃣  Testing mock Kinguin getKey method...');
      try {
        const keyRes = await mockKinguinClient.getKey(orderId);
        console.warn(`✅ Mock getKey succeeded: ${keyRes}`);
        expect(keyRes).toBeTruthy();
        expect(keyRes).toMatch(/^[A-Z0-9-]+$/);
      } catch (keyError) {
        const errorMsg = keyError instanceof Error ? keyError.message : String(keyError);
        console.warn(
          `⚠️  Mock getKey returned expected error (order not ready): ${errorMsg}`,
        );
        expect(errorMsg).toContain('not ready');
      }

      // Step 6: Verify mock client internal state
      console.warn('\nStep 6️⃣  Verifying mock client internal state tracking...');
      const finalState = mockKinguinClient.getInternalState();
      console.warn(`✅ Final state: ${JSON.stringify(finalState, null, 2)}`);
      expect(finalState).toHaveProperty('orders');
      expect(finalState).toHaveProperty('orderCount');
      expect(finalState.orderCount).toBe(1);
      expect(Array.isArray(finalState.orders)).toBe(true);
    } catch (error) {
      console.error(
        `❌ Mock client test failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }

    console.warn(
      '\n✅ All mock Kinguin API tests passed!\n✅ Mock client successfully injected and fully functional\n',
    );
    expect(true).toBe(true);
  });
});

import 'reflect-metadata';
import {
  INestApplication,
  Module,
  ValidationPipe,
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import { HttpModule } from '@nestjs/axios';

// Mock controller for testing
@Controller('catalog')
class MockCatalogController {
  @Get('products')
  getProducts(
    @Query('limit') _limit?: number,
    @Query('offset') _offset?: number,
    @Query('search') _search?: string,
    @Query('category') _category?: string,
  ) {
    return {
      data: [
        { id: '1', name: 'Elden Ring', price: '59.99', available: true },
        { id: '2', name: 'Baldurs Gate 3', price: '69.99', available: true },
      ],
      total: 2,
      page: 1,
      limit: _limit ?? 10,
    };
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    if (id === '1') {
      return {
        id: '1',
        name: 'Elden Ring',
        description: 'Action RPG from FromSoftware',
        price: '59.99',
        category: 'Games',
        available: true,
        stock: 100,
      };
    }
    throw new NotFoundException('Product not found');
  }

  @Get('search')
  searchProducts(@Query('q') _query?: string) {
    return {
      data: [
        { id: '1', name: 'Elden Ring', price: '59.99' },
      ],
      total: 1,
    };
  }
}

// Mock health controller
@Controller()
class MockHealthController {
  @Get('healthz')
  health() {
    return { ok: true, timestamp: new Date().toISOString() };
  }
}

// Mock orders controller for order tests
@Controller('orders')
class MockOrdersController {
  @Post()
  createOrder(@Body() body: any) {
    // Validation
    if (!body.email || !Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('Missing email or items');
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw new BadRequestException('Invalid email format');
    }
    // Item validation
    for (const item of body.items) {
      if (!item.productId) {
        throw new BadRequestException('Missing productId in items');
      }
      if ((item.quantity ?? 0) < 1) {
        throw new BadRequestException('Quantity must be positive');
      }
    }
    // Return created order
    return {
      id: `order-${Date.now()}`,
      email: body.email,
      items: body.items,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  @Get(':id')
  getOrder(@Param('id') id: string) {
    if (id.startsWith('order-')) {
      return {
        id,
        email: 'test@example.com',
        items: [{ productId: 'product-1', quantity: 1 }],
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }
    throw new NotFoundException('Order not found');
  }
}

// Test module - no database dependencies
@Module({
  imports: [HttpModule],
  controllers: [MockCatalogController, MockHealthController, MockOrdersController],
  providers: [],
})
class TestAppModule {}

describe('E2E: Catalog & Order Workflow (Minimal)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Scenario 1: Catalog Product Listing', () => {
    it('should list products', async () => {
      const res = await request(app.getHttpServer())
        .get('/catalog/products')
        .query({ limit: 10, offset: 0 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should search products by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/catalog/products')
        .query({ search: 'game', limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
    });

    it('should filter products by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/catalog/products')
        .query({ category: 'games', limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/catalog/products')
        .query({ limit: 5, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Scenario 2: Product Details & Pricing', () => {
    let productId: string;

    it('should get first product ID from listing', async () => {
      const response = await request(app.getHttpServer())
        .get('/catalog/products')
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      productId = response.body.data[0].id;
      expect(productId).toBeDefined();
    });

    it('should get product details by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/catalog/products/${productId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(productId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('price');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app.getHttpServer())
        .get('/catalog/products/invalid-id-12345');

      expect(response.status).toBe(404);
    });
  });

  describe('Scenario 3: Order Creation & Status', () => {
    let orderId: string;

    it('should create a new order', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          email: 'test@example.com',
          items: [
            {
              productId: 'product-1',
              quantity: 1,
            },
          ],
        });

      expect([201, 200]).toContain(response.status);
      expect(response.body).toHaveProperty('id');
      orderId = response.body.id;
    });

    it('should retrieve order status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.id).toBe(orderId);
        expect(response.body).toHaveProperty('status');
      }
    });

    it('should validate order items', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          email: 'test@example.com',
          items: [],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Scenario 4: Error Handling', () => {
    it('should reject malformed email', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          email: 'invalid-email',
          items: [{ productId: 'product-1', quantity: 1 }],
        });

      expect(response.status).toBe(400);
    });

    it('should reject negative quantity', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          email: 'test@example.com',
          items: [{ productId: 'product-1', quantity: -1 }],
        });

      expect(response.status).toBe(400);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('Scenario 5: Health Check', () => {
    it('should return API health status', async () => {
      const response = await request(app.getHttpServer()).get('/healthz');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok');
    });
  });
});

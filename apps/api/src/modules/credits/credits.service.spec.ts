import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreditsService } from './credits.service';
import { InsufficientCreditsError } from './credits.errors';

// ── Mock factories ──────────────────────────────────────────────────

function createMockUserCredits(overrides: Record<string, unknown> = {}) {
  return {
    id: 'uc-1',
    userId: 'user-1',
    cashBalance: '0.00000000',
    promoBalance: '0.00000000',
    totalToppedUp: '0.00000000',
    totalEarned: '0.00000000',
    totalSpent: '0.00000000',
    totalExpired: '0.00000000',
    ...overrides,
  };
}

function createMockTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tx-1',
    userId: 'user-1',
    type: 'topup',
    creditType: 'cash',
    amount: '10.00000000',
    balanceAfter: '10.00000000',
    remaining: null,
    referenceType: null,
    referenceId: null,
    description: null,
    expiresAt: null,
    expired: false,
    extended: false,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('CreditsService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let service: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userCreditsRepoMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let txRepoMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dataSourceMock: any;

  beforeEach(() => {
    userCreditsRepoMock = {
      findOne: vi.fn(),
      find: vi.fn(),
      findOneOrFail: vi.fn(),
      count: vi.fn(),
      createQueryBuilder: vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        into: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        orIgnore: vi.fn().mockReturnThis(),
        execute: vi.fn(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ total: '0' }),
      })),
    };

    txRepoMock = {
      findOne: vi.fn(),
      find: vi.fn(),
      findAndCount: vi.fn().mockResolvedValue([[], 0]),
      update: vi.fn(),
      createQueryBuilder: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([]),
        getRawOne: vi.fn().mockResolvedValue({ sum: '0', total: '0' }),
      })),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockManager: any = {
      findOne: vi.fn(),
      create: vi.fn((_, data) => ({ id: 'tx-new', ...data })),
      save: vi.fn((_, entity) => Promise.resolve(entity)),
      update: vi.fn(),
      query: vi.fn().mockResolvedValue([]),
    };

    dataSourceMock = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction: vi.fn(async (fn: any) => fn(mockManager)),
      query: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    service = new (CreditsService as unknown as new (...args: unknown[]) => unknown)(
      userCreditsRepoMock,
      txRepoMock,
      dataSourceMock,
    );
  });

  // ─── 1. getBalance ────────────────────────────────────────────────

  describe('getBalance()', () => {
    it('should return zero balances for non-existent user', async () => {
      userCreditsRepoMock.findOne.mockResolvedValue(null);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.getBalance('nonexistent');
      expect(result).toEqual({ cash: 0, promo: 0, total: 0 });
    });

    it('should return correct balances for existing user', async () => {
      userCreditsRepoMock.findOne.mockResolvedValue(
        createMockUserCredits({ cashBalance: '50.00000000', promoBalance: '25.00000000' }),
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.getBalance('user-1');
      expect(result).toEqual({ cash: 50, promo: 25, total: 75 });
    });
  });

  // ─── 2. getTransactionHistory ────────────────────────────────────

  describe('getTransactionHistory()', () => {
    it('should return paginated transactions', async () => {
      const mockTx = createMockTransaction();
      txRepoMock.findAndCount.mockResolvedValue([[mockTx], 1]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.getTransactionHistory('user-1', 1, 20);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter by credit type', async () => {
      txRepoMock.findAndCount.mockResolvedValue([[], 0]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await service.getTransactionHistory('user-1', 1, 20, 'promo');
      expect(txRepoMock.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', creditType: 'promo' },
        }),
      );
    });
  });

  // ─── 3. grantPromoCredits ────────────────────────────────────────

  describe('grantPromoCredits()', () => {
    it('should throw if amount <= 0', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await expect(service.grantPromoCredits('user-1', 0, 'admin_grant', 'admin', 'admin-1'))
        .rejects.toThrow('Grant amount must be positive');
    });

    it('should be idempotent (skip duplicate grants)', async () => {
      const existingTx = createMockTransaction({ type: 'admin_grant', creditType: 'promo' });

      dataSourceMock.transaction.mockImplementation(async (fn: (manager: unknown) => Promise<unknown>) => {
        const manager = {
          findOne: vi.fn().mockResolvedValue(existingTx),
          create: vi.fn(),
          save: vi.fn(),
          query: vi.fn(),
        };
        return fn(manager);
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.grantPromoCredits('user-1', 10, 'admin_grant', 'admin', 'admin-1');
      // Should return existing transaction without creating a new one
      expect(result).toEqual(existingTx);
    });

    it('should create promo credit grant with expiry', async () => {
      const mockUc = createMockUserCredits({ promoBalance: '0.00000000', totalEarned: '0.00000000' });
      const savedTx = createMockTransaction({
        type: 'admin_grant',
        creditType: 'promo',
        amount: '10.00000000',
        remaining: '10.00000000',
      });

      dataSourceMock.transaction.mockImplementation(async (fn: (manager: unknown) => Promise<unknown>) => {
        const manager = {
          findOne: vi.fn()
            .mockResolvedValueOnce(null) // idempotency check
            .mockResolvedValueOnce(mockUc), // getOrCreateUserCreditsInTx
          create: vi.fn(() => savedTx),
          save: vi.fn().mockResolvedValue(savedTx),
          query: vi.fn(),
          createQueryBuilder: vi.fn(() => ({
            insert: vi.fn().mockReturnThis(),
            into: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            orIgnore: vi.fn().mockReturnThis(),
            execute: vi.fn(),
          })),
        };
        return fn(manager);
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.grantPromoCredits('user-1', 10, 'admin_grant', 'admin', 'admin-1', 'Test grant', 90);
      expect(result).toBeDefined();
      expect(result.creditType).toBe('promo');
    });
  });

  // ─── 4. grantCashCredits ─────────────────────────────────────────

  describe('grantCashCredits()', () => {
    it('should throw if amount <= 0', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await expect(service.grantCashCredits('user-1', -5, 'topup', 'topup', 'topup-1'))
        .rejects.toThrow('Grant amount must be positive');
    });

    it('should create cash credit grant without expiry', async () => {
      const mockUc = createMockUserCredits({ cashBalance: '0.00000000', totalToppedUp: '0.00000000' });
      const savedTx = createMockTransaction({
        type: 'topup',
        creditType: 'cash',
        amount: '50.00000000',
        remaining: null,
        expiresAt: null,
      });

      dataSourceMock.transaction.mockImplementation(async (fn: (manager: unknown) => Promise<unknown>) => {
        const manager = {
          findOne: vi.fn()
            .mockResolvedValueOnce(null) // idempotency check
            .mockResolvedValueOnce(mockUc), // getOrCreateUserCreditsInTx
          create: vi.fn(() => savedTx),
          save: vi.fn().mockResolvedValue(savedTx),
          query: vi.fn(),
          createQueryBuilder: vi.fn(() => ({
            insert: vi.fn().mockReturnThis(),
            into: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            orIgnore: vi.fn().mockReturnThis(),
            execute: vi.fn(),
          })),
        };
        return fn(manager);
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.grantCashCredits('user-1', 50, 'topup', 'topup', 'topup-1', 'Topup');
      expect(result).toBeDefined();
      expect(result.creditType).toBe('cash');
      expect(result.expiresAt).toBeNull();
    });
  });

  // ─── 5. spendCredits ─────────────────────────────────────────────

  describe('spendCredits()', () => {
    it('should throw if amount <= 0', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await expect(service.spendCredits('user-1', 0, 'order-1'))
        .rejects.toThrow('Spend amount must be positive');
    });

    it('should throw InsufficientCreditsError if balance is too low', async () => {
      const mockUc = createMockUserCredits({ cashBalance: '5.00000000', promoBalance: '0.00000000' });

      dataSourceMock.transaction.mockImplementation(async (fn: (manager: unknown) => Promise<unknown>) => {
        const manager = {
          findOne: vi.fn().mockResolvedValue(mockUc),
          find: vi.fn().mockResolvedValue([]),
          create: vi.fn(),
          save: vi.fn(),
          query: vi.fn(),
        };
        return fn(manager);
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await expect(service.spendCredits('user-1', 100, 'order-1'))
        .rejects.toThrow(InsufficientCreditsError);
    });

    it('should spend promo credits first (FIFO) then cash', async () => {
      const mockUc = createMockUserCredits({
        cashBalance: '50.00000000',
        promoBalance: '30.00000000',
        totalSpent: '0.00000000',
      });

      const promoGrant = createMockTransaction({
        id: 'promo-grant-1',
        creditType: 'promo',
        remaining: '30.00000000',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        expired: false,
      });

      const savedSpendTxs: unknown[] = [];

      dataSourceMock.transaction.mockImplementation(async (fn: (manager: unknown) => Promise<unknown>) => {
        const manager = {
          findOne: vi.fn().mockResolvedValue(mockUc),
          find: vi.fn().mockResolvedValue([promoGrant]),
          create: vi.fn((_, data) => ({ id: `spend-${savedSpendTxs.length}`, ...data })),
          save: vi.fn().mockImplementation((_, entity) => {
            if (entity.type === 'spend') savedSpendTxs.push(entity);
            return Promise.resolve(entity);
          }),
          query: vi.fn(),
        };
        return fn(manager);
      });

      // Spend 60 → 30 promo + 30 cash
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.spendCredits('user-1', 60, 'order-1');
      expect(result.promoUsed).toBe(30);
      expect(result.cashUsed).toBe(30);
      expect(result.transactions).toHaveLength(2);
    });
  });

  // ─── 6. updateSpendReference ──────────────────────────────────────

  describe('updateSpendReference()', () => {
    it('should update all matching transactions', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await service.updateSpendReference('pending-order', 'order-abc');
      expect(txRepoMock.update).toHaveBeenCalledWith(
        { referenceType: 'order', referenceId: 'pending-order' },
        { referenceId: 'order-abc' },
      );
    });
  });

  // ─── 7. refundCredits ────────────────────────────────────────────

  describe('refundCredits()', () => {
    it('should throw if amount <= 0', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await expect(service.refundCredits('user-1', 0, 'cash', 'order-1'))
        .rejects.toThrow('Refund amount must be positive');
    });

    it('should refund cash credits and update balance', async () => {
      const mockUc = createMockUserCredits({ cashBalance: '10.00000000' });
      const savedTx = createMockTransaction({
        type: 'refund',
        creditType: 'cash',
        amount: '5.00000000',
        balanceAfter: '15.00000000',
      });

      dataSourceMock.transaction.mockImplementation(async (fn: (manager: unknown) => Promise<unknown>) => {
        const manager = {
          findOne: vi.fn().mockResolvedValue(mockUc),
          create: vi.fn(() => savedTx),
          save: vi.fn().mockResolvedValue(savedTx),
          query: vi.fn(),
          createQueryBuilder: vi.fn(() => ({
            insert: vi.fn().mockReturnThis(),
            into: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            orIgnore: vi.fn().mockReturnThis(),
            execute: vi.fn(),
          })),
        };
        return fn(manager);
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.refundCredits('user-1', 5, 'cash', 'order-1');
      expect(result).toBeDefined();
      expect(result.type).toBe('refund');
    });
  });

  // ─── 8. forfeitAllCredits ─────────────────────────────────────────

  describe('forfeitAllCredits()', () => {
    it('should return zeros if user has no credits', async () => {
      userCreditsRepoMock.findOne.mockResolvedValue(null);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.forfeitAllCredits('user-1');
      expect(result).toEqual({ cashForfeited: 0, promoForfeited: 0, total: 0 });
    });

    it('should forfeit all credits for existing user', async () => {
      userCreditsRepoMock.findOne.mockResolvedValue(
        createMockUserCredits({ cashBalance: '100.00000000', promoBalance: '50.00000000' }),
      );

      const mockUc = createMockUserCredits({
        cashBalance: '100.00000000',
        promoBalance: '50.00000000',
        totalExpired: '0.00000000',
      });

      dataSourceMock.transaction.mockImplementation(async (fn: (manager: unknown) => Promise<unknown>) => {
        const manager = {
          findOne: vi.fn().mockResolvedValue(mockUc),
          create: vi.fn((_, data) => ({ id: 'forfeit-tx', ...data })),
          save: vi.fn().mockImplementation((_, entity) => Promise.resolve(entity)),
          update: vi.fn(),
          query: vi.fn(),
          createQueryBuilder: vi.fn(() => ({
            insert: vi.fn().mockReturnThis(),
            into: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            orIgnore: vi.fn().mockReturnThis(),
            execute: vi.fn(),
          })),
        };
        return fn(manager);
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.forfeitAllCredits('user-1');
      expect(result.cashForfeited).toBe(100);
      expect(result.promoForfeited).toBe(50);
      expect(result.total).toBe(150);
    });
  });

  // ─── 9. adminGrant / adminAdjust ──────────────────────────────────

  describe('adminGrant()', () => {
    it('should call grantPromoCredits with correct params', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const grantSpy = vi.spyOn(service, 'grantPromoCredits').mockResolvedValue(
        createMockTransaction({ type: 'admin_grant', creditType: 'promo' }),
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await service.adminGrant('user-1', 25, 90, 'Test grant', 'admin-1');

      expect(grantSpy).toHaveBeenCalledWith(
        'user-1',
        25,
        'admin_grant',
        'admin',
        'admin-1',
        'Admin grant: Test grant',
        90,
      );
    });
  });

  describe('adminAdjust()', () => {
    it('should adjust cash credits correctly', async () => {
      const mockUc = createMockUserCredits({ cashBalance: '100.00000000' });
      const adjustTx = createMockTransaction({
        type: 'adjustment',
        creditType: 'cash',
        amount: '-20.00000000',
        balanceAfter: '80.00000000',
      });

      dataSourceMock.transaction.mockImplementation(async (fn: (manager: unknown) => Promise<unknown>) => {
        const manager = {
          findOne: vi.fn().mockResolvedValue(mockUc),
          create: vi.fn(() => adjustTx),
          save: vi.fn().mockResolvedValue(adjustTx),
          query: vi.fn(),
          createQueryBuilder: vi.fn(() => ({
            insert: vi.fn().mockReturnThis(),
            into: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            orIgnore: vi.fn().mockReturnThis(),
            execute: vi.fn(),
          })),
        };
        return fn(manager);
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.adminAdjust('user-1', -20, 'cash', 'Deduction test', 'admin-1');
      expect(result.type).toBe('adjustment');
      expect(result.creditType).toBe('cash');
    });

    it('should throw InsufficientCreditsError for over-deduction', async () => {
      const mockUc = createMockUserCredits({ cashBalance: '5.00000000' });

      dataSourceMock.transaction.mockImplementation(async (fn: (manager: unknown) => Promise<unknown>) => {
        const manager = {
          findOne: vi.fn().mockResolvedValue(mockUc),
          create: vi.fn(),
          save: vi.fn(),
          query: vi.fn(),
          createQueryBuilder: vi.fn(() => ({
            insert: vi.fn().mockReturnThis(),
            into: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            orIgnore: vi.fn().mockReturnThis(),
            execute: vi.fn(),
          })),
        };
        return fn(manager);
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await expect(service.adminAdjust('user-1', -100, 'cash', 'Over-deduction', 'admin-1'))
        .rejects.toThrow(InsufficientCreditsError);
    });
  });

  // ─── 10. reconcile ────────────────────────────────────────────────

  describe('reconcile()', () => {
    it('should return zero mismatches for empty user list', async () => {
      userCreditsRepoMock.find.mockResolvedValue([]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.reconcile();
      expect(result).toEqual({ checked: 0, mismatches: 0 });
    });

    it('should detect balance mismatch', async () => {
      const uc = createMockUserCredits({ cashBalance: '100.00000000', promoBalance: '50.00000000' });
      userCreditsRepoMock.find.mockResolvedValue([uc]);

      // Transaction sums don't match stored balances
      txRepoMock.createQueryBuilder.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn()
          .mockResolvedValueOnce({ sum: '80.00000000' }) // cash sum ≠ 100
          .mockResolvedValueOnce({ sum: '50.00000000' }), // promo sum matches
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.reconcile();
      expect(result.checked).toBe(1);
      expect(result.mismatches).toBe(1);
    });
  });

  // ─── 11. getExpiringCredits ───────────────────────────────────────

  describe('getExpiringCredits()', () => {
    it('should return zero for user with no expiring credits', async () => {
      txRepoMock.find.mockResolvedValue([]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.getExpiringCredits('user-1', 7);
      expect(result).toEqual({ amount: 0, earliest: null });
    });

    it('should sum expiring credits and return earliest date', async () => {
      const earlyDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const laterDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      txRepoMock.find.mockResolvedValue([
        createMockTransaction({ remaining: '10.00000000', expiresAt: earlyDate, creditType: 'promo', expired: false }),
        createMockTransaction({ remaining: '5.00000000', expiresAt: laterDate, creditType: 'promo', expired: false }),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await service.getExpiringCredits('user-1', 7);
      expect(result.amount).toBe(15);
      expect(result.earliest).toEqual(earlyDate);
    });
  });
});

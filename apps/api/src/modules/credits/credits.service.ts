import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type QueryRunner, Repository, MoreThan, LessThanOrEqual, And } from 'typeorm';
import { UserCredits } from './entities/user-credits.entity';
import { CreditTransaction, type CreditTransactionType, type CreditReferenceType } from './entities/credit-transaction.entity';
import { InsufficientCreditsError } from './credits.errors';

interface SpendResult {
  promoUsed: number;
  cashUsed: number;
  transactions: CreditTransaction[];
}

interface BalanceResult {
  cash: number;
  promo: number;
  total: number;
}

interface ExpiringResult {
  amount: number;
  earliest: Date | null;
}

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
    @InjectRepository(UserCredits)
    private readonly userCreditsRepo: Repository<UserCredits>,
    @InjectRepository(CreditTransaction)
    private readonly txRepo: Repository<CreditTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Read Operations ─────────────────────────────────────────────

  async getBalance(userId: string): Promise<BalanceResult> {
    const uc = await this.userCreditsRepo.findOne({ where: { userId } });
    if (uc === null || uc === undefined) {
      return { cash: 0, promo: 0, total: 0 };
    }
    const cash = parseFloat(uc.cashBalance);
    const promo = parseFloat(uc.promoBalance);
    return { cash, promo, total: cash + promo };
  }

  async getTransactionHistory(
    userId: string,
    page: number,
    limit: number,
    creditType?: 'cash' | 'promo',
  ): Promise<{ items: CreditTransaction[]; total: number; page: number; limit: number }> {
    const where: Record<string, unknown> = { userId };
    if (creditType !== undefined) {
      where.creditType = creditType;
    }
    const [items, total] = await this.txRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async getExpiringCredits(userId: string, withinDays: number): Promise<ExpiringResult> {
    const now = new Date();
    const deadline = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

    const grants = await this.txRepo.find({
      where: {
        userId,
        creditType: 'promo',
        expired: false,
        remaining: MoreThan('0'),
        expiresAt: And(MoreThan(now), LessThanOrEqual(deadline)),
      },
      order: { expiresAt: 'ASC' },
    });

    let amount = 0;
    let earliest: Date | null = null;
    for (const g of grants) {
      amount += parseFloat(g.remaining ?? '0');
      if (earliest === null && g.expiresAt !== null && g.expiresAt !== undefined) {
        earliest = g.expiresAt;
      }
    }

    return { amount, earliest };
  }

  /**
   * Get all users who have promo credits expiring within a given number of days.
   * Used by the expiry warning cron job to send email notifications.
   */
  async getUsersWithExpiringCredits(withinDays: number): Promise<Array<{
    userId: string;
    userEmail: string;
    expiringAmount: number;
    expiresAt: Date;
    currentBalance: number;
  }>> {
    const now = new Date();
    const deadline = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

    // Query for promo credit transactions that are expiring within the deadline
    const expiringTxs = await this.txRepo
      .createQueryBuilder('tx')
      .select([
        'tx.userId AS "userId"',
        'SUM(CAST(tx.remaining AS DECIMAL)) AS "expiringAmount"',
        'MIN(tx."expiresAt") AS "expiresAt"',
      ])
      .where('tx.creditType = :type', { type: 'promo' })
      .andWhere('tx.expired = false')
      .andWhere('CAST(tx.remaining AS DECIMAL) > 0')
      .andWhere('tx."expiresAt" > :now', { now })
      .andWhere('tx."expiresAt" <= :deadline', { deadline })
      .groupBy('tx.userId')
      .getRawMany<{ userId: string; expiringAmount: string; expiresAt: Date }>();

    if (expiringTxs.length === 0) {
      return [];
    }

    // Get user emails and current balances
    const results: Array<{
      userId: string;
      userEmail: string;
      expiringAmount: number;
      expiresAt: Date;
      currentBalance: number;
    }> = [];

    for (const tx of expiringTxs) {
      // Get user email from user_credits table (it stores userId)
      const userCredits = await this.userCreditsRepo.findOne({ where: { userId: tx.userId } });
      if (userCredits === null || userCredits === undefined) continue;

      // Get user email - we need to query the users table
      // Since we don't have direct access, we'll use a raw query
      const userResult = await this.dataSource.query<Array<{ email: string }>>(
        'SELECT email FROM "users" WHERE id = $1',
        [tx.userId],
      );
      const userRow = userResult[0];
      if (userRow === undefined) continue;

      const balance = await this.getBalance(tx.userId);

      results.push({
        userId: tx.userId,
        userEmail: userRow.email,
        expiringAmount: parseFloat(tx.expiringAmount),
        expiresAt: tx.expiresAt,
        currentBalance: balance.total,
      });
    }

    return results;
  }

  // ─── Write Operations (all transactional) ─────────────────────────

  async grantPromoCredits(
    userId: string,
    amount: number,
    type: CreditTransactionType,
    referenceType: CreditReferenceType,
    referenceId: string,
    description?: string,
    expiresInDays: number = 90,
  ): Promise<CreditTransaction> {
    if (amount <= 0) {
      throw new Error('Grant amount must be positive');
    }

    return this.dataSource.transaction(async (manager) => {
      // Idempotency check
      const existing = await manager.findOne(CreditTransaction, {
        where: { referenceType, referenceId, userId },
      });
      if (existing !== null && existing !== undefined) {
        this.logger.log(`Idempotent grant: already exists for ${referenceType}:${referenceId}`);
        return existing;
      }

      const uc = await this.getOrCreateUserCreditsInTx(manager, userId);

      // Lock row for update
      await manager.query(
        'SELECT 1 FROM user_credits WHERE id = $1 FOR UPDATE',
        [uc.id],
      );

      const newPromo = parseFloat(uc.promoBalance) + amount;
      const newTotalEarned = parseFloat(uc.totalEarned) + amount;

      uc.promoBalance = newPromo.toFixed(8);
      uc.totalEarned = newTotalEarned.toFixed(8);
      await manager.save(UserCredits, uc);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const tx = manager.create(CreditTransaction, {
        userId,
        type,
        creditType: 'promo',
        amount: amount.toFixed(8),
        balanceAfter: newPromo.toFixed(8),
        remaining: amount.toFixed(8),
        referenceType,
        referenceId,
        description: description ?? `Promo credit: ${type}`,
        expiresAt,
        expired: false,
      });

      const saved = await manager.save(CreditTransaction, tx);
      this.logger.log(`Granted €${amount.toFixed(2)} promo credits to user ${userId} (${type})`);
      return saved;
    });
  }

  async grantCashCredits(
    userId: string,
    amount: number,
    type: CreditTransactionType,
    referenceType: CreditReferenceType,
    referenceId: string,
    description?: string,
  ): Promise<CreditTransaction> {
    if (amount <= 0) {
      throw new Error('Grant amount must be positive');
    }

    return this.dataSource.transaction(async (manager) => {
      // Idempotency check
      const existing = await manager.findOne(CreditTransaction, {
        where: { referenceType, referenceId, userId },
      });
      if (existing !== null && existing !== undefined) {
        this.logger.log(`Idempotent grant: already exists for ${referenceType}:${referenceId}`);
        return existing;
      }

      const uc = await this.getOrCreateUserCreditsInTx(manager, userId);

      await manager.query(
        'SELECT 1 FROM user_credits WHERE id = $1 FOR UPDATE',
        [uc.id],
      );

      const newCash = parseFloat(uc.cashBalance) + amount;
      const newTotalToppedUp = parseFloat(uc.totalToppedUp) + amount;

      uc.cashBalance = newCash.toFixed(8);
      uc.totalToppedUp = newTotalToppedUp.toFixed(8);
      await manager.save(UserCredits, uc);

      const tx = manager.create(CreditTransaction, {
        userId,
        type,
        creditType: 'cash',
        amount: amount.toFixed(8),
        balanceAfter: newCash.toFixed(8),
        remaining: null,
        referenceType,
        referenceId,
        description: description ?? `Cash credit: ${type}`,
        expiresAt: null,
        expired: false,
      });

      const saved = await manager.save(CreditTransaction, tx);
      this.logger.log(`Granted €${amount.toFixed(2)} cash credits to user ${userId} (${type})`);
      return saved;
    });
  }

  async spendCredits(userId: string, amount: number, orderId: string): Promise<SpendResult> {
    if (amount <= 0) {
      throw new Error('Spend amount must be positive');
    }

    return this.dataSource.transaction(async (manager) => {
      const uc = await this.getOrCreateUserCreditsInTx(manager, userId);

      // Row-level lock — prevents double-spend race conditions
      await manager.query(
        'SELECT 1 FROM user_credits WHERE id = $1 FOR UPDATE',
        [uc.id],
      );

      const cashBalance = parseFloat(uc.cashBalance);
      const promoBalance = parseFloat(uc.promoBalance);
      const totalBalance = cashBalance + promoBalance;

      if (totalBalance < amount - 0.001) {
        throw new InsufficientCreditsError(amount, totalBalance);
      }

      const transactions: CreditTransaction[] = [];
      let remaining = amount;
      let promoUsed = 0;
      let cashUsed = 0;

      // 1. Deduct promo credits first (FIFO by expires_at)
      if (promoBalance > 0 && remaining > 0) {
        const promoGrants = await manager.find(CreditTransaction, {
          where: {
            userId,
            creditType: 'promo',
            expired: false,
            remaining: MoreThan('0'),
          },
          order: { expiresAt: 'ASC' },
        });

        for (const grant of promoGrants) {
          if (remaining <= 0.001) break;

          const grantRemaining = parseFloat(grant.remaining ?? '0');
          if (grantRemaining <= 0) continue;

          const consume = Math.min(grantRemaining, remaining);
          const newRemaining = grantRemaining - consume;

          grant.remaining = newRemaining.toFixed(8);
          await manager.save(CreditTransaction, grant);

          promoUsed += consume;
          remaining -= consume;

          const newPromoBalance = promoBalance - promoUsed;
          const tx = manager.create(CreditTransaction, {
            userId,
            type: 'spend',
            creditType: 'promo',
            amount: (-consume).toFixed(8),
            balanceAfter: Math.max(0, newPromoBalance).toFixed(8),
            remaining: null,
            referenceType: 'order',
            referenceId: orderId,
            description: `Credits applied to order`,
          });
          transactions.push(await manager.save(CreditTransaction, tx));
        }
      }

      // 2. Deduct cash credits for remainder
      if (remaining > 0.001) {
        cashUsed = remaining;
        const newCashBalance = cashBalance - cashUsed;

        const tx = manager.create(CreditTransaction, {
          userId,
          type: 'spend',
          creditType: 'cash',
          amount: (-cashUsed).toFixed(8),
          balanceAfter: Math.max(0, newCashBalance).toFixed(8),
          remaining: null,
          referenceType: 'order',
          referenceId: orderId,
          description: `Credits applied to order`,
        });
        transactions.push(await manager.save(CreditTransaction, tx));
        remaining = 0;
      }

      // 3. Update aggregate balances
      uc.promoBalance = Math.max(0, promoBalance - promoUsed).toFixed(8);
      uc.cashBalance = Math.max(0, cashBalance - cashUsed).toFixed(8);
      uc.totalSpent = (parseFloat(uc.totalSpent) + promoUsed + cashUsed).toFixed(8);
      await manager.save(UserCredits, uc);

      this.logger.log(
        `Spent €${amount.toFixed(2)} credits for order ${orderId} (promo: €${promoUsed.toFixed(2)}, cash: €${cashUsed.toFixed(2)})`,
      );

      return { promoUsed, cashUsed, transactions };
    });
  }

  /**
   * Update spend transaction references from a temporary ID to the actual order ID.
   * Called right after order creation when credits were spent with 'pending-order'.
   */
  async updateSpendReference(oldReferenceId: string, newReferenceId: string): Promise<void> {
    await this.txRepo.update(
      { referenceType: 'order', referenceId: oldReferenceId },
      { referenceId: newReferenceId },
    );
  }

  async refundCredits(
    userId: string,
    amount: number,
    creditType: 'cash' | 'promo',
    orderId: string,
    description?: string,
    expiresInDays?: number,
  ): Promise<CreditTransaction> {
    if (amount <= 0) {
      throw new Error('Refund amount must be positive');
    }

    return this.dataSource.transaction(async (manager) => {
      const uc = await this.getOrCreateUserCreditsInTx(manager, userId);

      await manager.query(
        'SELECT 1 FROM user_credits WHERE id = $1 FOR UPDATE',
        [uc.id],
      );

      if (creditType === 'cash') {
        const newCash = parseFloat(uc.cashBalance) + amount;
        uc.cashBalance = newCash.toFixed(8);
        await manager.save(UserCredits, uc);

        const tx = manager.create(CreditTransaction, {
          userId,
          type: 'refund',
          creditType: 'cash',
          amount: amount.toFixed(8),
          balanceAfter: newCash.toFixed(8),
          remaining: null,
          referenceType: 'order',
          referenceId: orderId,
          description: description ?? 'Refund to cash credits',
        });
        return manager.save(CreditTransaction, tx);
      } else {
        const newPromo = parseFloat(uc.promoBalance) + amount;
        uc.promoBalance = newPromo.toFixed(8);
        await manager.save(UserCredits, uc);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (expiresInDays ?? 90));

        const tx = manager.create(CreditTransaction, {
          userId,
          type: 'refund',
          creditType: 'promo',
          amount: amount.toFixed(8),
          balanceAfter: newPromo.toFixed(8),
          remaining: amount.toFixed(8),
          referenceType: 'order',
          referenceId: orderId,
          description: description ?? 'Refund to promo credits',
          expiresAt,
        });
        return manager.save(CreditTransaction, tx);
      }
    });
  }

  // ─── Admin Operations ──────────────────────────────────────────

  async adminGrant(
    userId: string,
    amount: number,
    expiresInDays: number,
    reason: string,
    adminId: string,
  ): Promise<CreditTransaction> {
    return this.grantPromoCredits(
      userId,
      amount,
      'admin_grant',
      'admin',
      adminId,
      `Admin grant: ${reason}`,
      expiresInDays,
    );
  }

  async adminAdjust(
    userId: string,
    amount: number,
    creditType: 'cash' | 'promo',
    reason: string,
    adminId: string,
  ): Promise<CreditTransaction> {
    return this.dataSource.transaction(async (manager) => {
      const uc = await this.getOrCreateUserCreditsInTx(manager, userId);

      await manager.query(
        'SELECT 1 FROM user_credits WHERE id = $1 FOR UPDATE',
        [uc.id],
      );

      let newBalance: number;
      if (creditType === 'cash') {
        newBalance = parseFloat(uc.cashBalance) + amount;
        if (newBalance < 0) {
          throw new InsufficientCreditsError(Math.abs(amount), parseFloat(uc.cashBalance));
        }
        uc.cashBalance = newBalance.toFixed(8);
      } else {
        newBalance = parseFloat(uc.promoBalance) + amount;
        if (newBalance < 0) {
          throw new InsufficientCreditsError(Math.abs(amount), parseFloat(uc.promoBalance));
        }
        uc.promoBalance = newBalance.toFixed(8);
      }

      await manager.save(UserCredits, uc);

      const tx = manager.create(CreditTransaction, {
        userId,
        type: 'adjustment',
        creditType,
        amount: amount.toFixed(8),
        balanceAfter: newBalance.toFixed(8),
        remaining: creditType === 'promo' && amount > 0 ? amount.toFixed(8) : null,
        referenceType: 'admin',
        referenceId: adminId,
        description: `Admin adjustment: ${reason}`,
        expiresAt: creditType === 'promo' && amount > 0
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          : null,
      });

      const saved = await manager.save(CreditTransaction, tx);
      this.logger.log(
        `Admin ${adminId} adjusted ${creditType} credits for user ${userId}: €${amount.toFixed(2)} (${reason})`,
      );
      return saved;
    });
  }

  // ─── Expiry ──────────────────────────────────────────────────

  async expirePromoCredits(): Promise<number> {
    const now = new Date();
    let expiredCount = 0;

    // Find all unexpired promo grants past their expiry date
    const expiredGrants = await this.txRepo.find({
      where: {
        creditType: 'promo',
        expired: false,
        remaining: MoreThan('0'),
        expiresAt: LessThanOrEqual(now),
      },
    });

    // Group by userId for batch processing
    const byUser = new Map<string, CreditTransaction[]>();
    for (const grant of expiredGrants) {
      const existing = byUser.get(grant.userId) ?? [];
      existing.push(grant);
      byUser.set(grant.userId, existing);
    }

    for (const [userId, grants] of byUser.entries()) {
      await this.dataSource.transaction(async (manager) => {
        const uc = await manager.findOne(UserCredits, { where: { userId } });
        if (uc === null || uc === undefined) return;

        await manager.query(
          'SELECT 1 FROM user_credits WHERE id = $1 FOR UPDATE',
          [uc.id],
        );

        let totalExpiredAmount = 0;

        for (const grant of grants) {
          const remainingAmount = parseFloat(grant.remaining ?? '0');
          if (remainingAmount <= 0) continue;

          // V3 Feature: Active user expiry extension (disabled until V3 launch)
          // Extension logic: if user has a purchase in last 30 days and grant
          // hasn't been extended yet, extend by 30 days
          // TODO: Enable via feature flag when V3 launches
          /*
          if (!grant.extended) {
            const recentOrder = await manager.query(
              `SELECT 1 FROM orders WHERE "userId" = $1 AND status = 'fulfilled' AND "createdAt" > NOW() - INTERVAL '30 days' LIMIT 1`,
              [userId],
            );
            if (recentOrder.length > 0) {
              const newExpiry = new Date(grant.expiresAt!.getTime() + 30 * 24 * 60 * 60 * 1000);
              grant.expiresAt = newExpiry;
              grant.extended = true;
              await manager.save(CreditTransaction, grant);
              this.logger.log(`Extended promo credit expiry for active user ${userId} to ${newExpiry.toISOString()}`);
              continue; // Skip expiring this grant
            }
          }
          */

          // Create expiry debit transaction
          const newPromo = parseFloat(uc.promoBalance) - remainingAmount;
          const tx = manager.create(CreditTransaction, {
            userId,
            type: 'expiry',
            creditType: 'promo',
            amount: (-remainingAmount).toFixed(8),
            balanceAfter: Math.max(0, newPromo).toFixed(8),
            remaining: null,
            referenceType: null,
            referenceId: null,
            description: `Promo credits expired`,
          });
          await manager.save(CreditTransaction, tx);

          grant.expired = true;
          grant.remaining = '0.00000000';
          await manager.save(CreditTransaction, grant);

          totalExpiredAmount += remainingAmount;
          expiredCount++;
        }

        if (totalExpiredAmount > 0) {
          uc.promoBalance = Math.max(0, parseFloat(uc.promoBalance) - totalExpiredAmount).toFixed(8);
          uc.totalExpired = (parseFloat(uc.totalExpired) + totalExpiredAmount).toFixed(8);
          await manager.save(UserCredits, uc);
        }
      });
    }

    this.logger.log(`Expired ${expiredCount} promo credit grant(s)`);
    return expiredCount;
  }

  // ─── Reconciliation ──────────────────────────────────────────

  async reconcile(): Promise<{ checked: number; mismatches: number }> {
    const allUsers = await this.userCreditsRepo.find();
    let mismatches = 0;

    for (const uc of allUsers) {
      // Sum all cash transactions
      const cashResult = await this.txRepo
        .createQueryBuilder('tx')
        .select('COALESCE(SUM(tx.amount::numeric), 0)', 'sum')
        .where('tx.userId = :userId AND tx.creditType = :type', { userId: uc.userId, type: 'cash' })
        .getRawOne();

      // Sum all promo transactions
      const promoResult = await this.txRepo
        .createQueryBuilder('tx')
        .select('COALESCE(SUM(tx.amount::numeric), 0)', 'sum')
        .where('tx.userId = :userId AND tx.creditType = :type', { userId: uc.userId, type: 'promo' })
        .getRawOne();

      const computedCash = parseFloat(cashResult?.sum ?? '0');
      const computedPromo = parseFloat(promoResult?.sum ?? '0');
      const storedCash = parseFloat(uc.cashBalance);
      const storedPromo = parseFloat(uc.promoBalance);

      if (Math.abs(storedCash - computedCash) > 0.01 || Math.abs(storedPromo - computedPromo) > 0.01) {
        mismatches++;
        this.logger.error(
          `CREDIT BALANCE MISMATCH for user ${uc.userId}: ` +
          `stored cash=${storedCash}, computed=${computedCash}; ` +
          `stored promo=${storedPromo}, computed=${computedPromo}`,
        );
      }
    }

    this.logger.log(`Reconciliation complete: ${allUsers.length} users checked, ${mismatches} mismatches`);
    return { checked: allUsers.length, mismatches };
  }

  // ─── Admin Stats ───────────────────────────────────────────────

  async getStats(): Promise<{
    totalCashOutstanding: string;
    totalPromoOutstanding: string;
    issuedThisMonth: string;
    spentThisMonth: string;
    expiryRate: string;
    totalUsers: number;
  }> {
    const cashResult = await this.userCreditsRepo
      .createQueryBuilder('uc')
      .select('COALESCE(SUM(uc."cashBalance"::numeric), 0)', 'total')
      .getRawOne();

    const promoResult = await this.userCreditsRepo
      .createQueryBuilder('uc')
      .select('COALESCE(SUM(uc."promoBalance"::numeric), 0)', 'total')
      .getRawOne();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const issuedResult = await this.txRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.amount::numeric), 0)', 'total')
      .where('tx.amount::numeric > 0 AND tx."createdAt" >= :start', { start: startOfMonth })
      .getRawOne();

    const spentResult = await this.txRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(ABS(tx.amount::numeric)), 0)', 'total')
      .where("tx.type = 'spend' AND tx.\"createdAt\" >= :start", { start: startOfMonth })
      .getRawOne();

    const totalEarnedResult = await this.userCreditsRepo
      .createQueryBuilder('uc')
      .select('COALESCE(SUM(uc."totalEarned"::numeric), 0)', 'total')
      .getRawOne();

    const totalExpiredResult = await this.userCreditsRepo
      .createQueryBuilder('uc')
      .select('COALESCE(SUM(uc."totalExpired"::numeric), 0)', 'total')
      .getRawOne();

    const totalEarned = parseFloat(totalEarnedResult?.total ?? '0');
    const totalExpired = parseFloat(totalExpiredResult?.total ?? '0');
    const expiryRate = totalEarned > 0 ? ((totalExpired / totalEarned) * 100).toFixed(2) : '0.00';

    const totalUsers = await this.userCreditsRepo.count();

    return {
      totalCashOutstanding: parseFloat(cashResult?.total ?? '0').toFixed(8),
      totalPromoOutstanding: parseFloat(promoResult?.total ?? '0').toFixed(8),
      issuedThisMonth: parseFloat(issuedResult?.total ?? '0').toFixed(8),
      spentThisMonth: parseFloat(spentResult?.total ?? '0').toFixed(8),
      expiryRate,
      totalUsers,
    };
  }

  // ─── Account Deletion: forfeit all credits ─────────────────────

  /**
   * Forfeit all credits for a user being deleted.
   * Clears both cash and promo balances, creates audit transaction.
   * Returns the total forfeited amount for deletion confirmation.
   */
  async forfeitAllCredits(userId: string): Promise<{ cashForfeited: number; promoForfeited: number; total: number }> {
    const balance = await this.getBalance(userId);

    if (balance.total <= 0) {
      this.logger.debug(`[FORFEIT] User ${userId} has no credits to forfeit`);
      return { cashForfeited: 0, promoForfeited: 0, total: 0 };
    }

    const cashForfeited = balance.cash;
    const promoForfeited = balance.promo;

    await this.dataSource.transaction(async (manager) => {
      const uc = await this.getOrCreateUserCreditsInTx(manager, userId);

      // Create forfeit transaction for audit trail
      if (cashForfeited > 0) {
        const txCash = manager.create(CreditTransaction, {
          userId,
          type: 'forfeit',
          creditType: 'cash',
          amount: '-' + cashForfeited.toFixed(8),
          balanceAfter: '0',
          description: 'Account deleted - credits forfeited',
        });
        await manager.save(txCash);
      }

      if (promoForfeited > 0) {
        const txPromo = manager.create(CreditTransaction, {
          userId,
          type: 'forfeit',
          creditType: 'promo',
          amount: '-' + promoForfeited.toFixed(8),
          balanceAfter: '0',
          description: 'Account deleted - credits forfeited',
        });
        await manager.save(txPromo);
      }

      // Zero out all balances and mark expired promo credits
      await manager.update(UserCredits, { id: uc.id }, {
        cashBalance: '0',
        promoBalance: '0',
        totalExpired: (parseFloat(uc.totalExpired) + promoForfeited).toFixed(8),
      });

      // Mark all active promo credits as expired
      await manager.update(
        CreditTransaction,
        { userId, creditType: 'promo', expired: false, remaining: MoreThan(0) },
        { expired: true, remaining: '0' },
      );
    });

    this.logger.log(
      `[FORFEIT] User ${userId} forfeited €${cashForfeited.toFixed(2)} cash + €${promoForfeited.toFixed(2)} promo = €${balance.total.toFixed(2)} total`,
    );

    return { cashForfeited, promoForfeited, total: balance.total };
  }

  // ─── Admin: list user balances ────────────────────────────────

  async getAdminUserBalances(
    page: number,
    limit: number,
    email?: string,
    sortBy?: 'balance' | 'createdAt',
  ): Promise<{ items: Array<{ userId: string; email: string; cashBalance: string; promoBalance: string; totalSpent: string; createdAt: Date }>; total: number }> {
    const qb = this.userCreditsRepo
      .createQueryBuilder('uc')
      .innerJoin('users', 'u', 'u.id = uc."userId"')
      .select([
        'uc."userId" AS "userId"',
        'u.email AS email',
        'uc."cashBalance" AS "cashBalance"',
        'uc."promoBalance" AS "promoBalance"',
        'uc."totalSpent" AS "totalSpent"',
        'uc."createdAt" AS "createdAt"',
      ]);

    if (email !== undefined && email.length > 0) {
      qb.where('u.email ILIKE :email', { email: `%${email}%` });
    }

    if (sortBy === 'balance') {
      qb.orderBy('(uc."cashBalance"::numeric + uc."promoBalance"::numeric)', 'DESC');
    } else {
      qb.orderBy('uc."createdAt"', 'DESC');
    }

    const total = await qb.getCount();
    const items = await qb.offset((page - 1) * limit).limit(limit).getRawMany();

    return { items, total };
  }

  // ─── Helpers ─────────────────────────────────────────────────

  async getOrCreateUserCredits(userId: string): Promise<UserCredits> {
    const existing = await this.userCreditsRepo.findOne({ where: { userId } });
    if (existing !== null && existing !== undefined) {
      return existing;
    }

    // Race-safe creation: INSERT ... ON CONFLICT DO NOTHING
    await this.userCreditsRepo
      .createQueryBuilder()
      .insert()
      .into(UserCredits)
      .values({ userId })
      .orIgnore()
      .execute();

    const created = await this.userCreditsRepo.findOneOrFail({ where: { userId } });
    return created;
  }

  private async getOrCreateUserCreditsInTx(
    manager: import('typeorm').EntityManager,
    userId: string,
  ): Promise<UserCredits> {
    let uc = await manager.findOne(UserCredits, { where: { userId } });
    if (uc !== null && uc !== undefined) {
      return uc;
    }

    // Race-safe creation within transaction
    await manager
      .createQueryBuilder()
      .insert()
      .into(UserCredits)
      .values({ userId })
      .orIgnore()
      .execute();

    uc = await manager.findOneOrFail(UserCredits, { where: { userId } });
    return uc;
  }
}

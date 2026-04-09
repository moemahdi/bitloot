import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCreditsSchema1800000000000 implements MigrationInterface {
  name = 'CreateCreditsSchema1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── user_credits table ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_credits" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"        uuid NOT NULL,
        "cashBalance"   decimal(20,8) NOT NULL DEFAULT 0,
        "promoBalance"  decimal(20,8) NOT NULL DEFAULT 0,
        "totalToppedUp" decimal(20,8) NOT NULL DEFAULT 0,
        "totalEarned"   decimal(20,8) NOT NULL DEFAULT 0,
        "totalSpent"    decimal(20,8) NOT NULL DEFAULT 0,
        "totalExpired"  decimal(20,8) NOT NULL DEFAULT 0,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_credits" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_user_credits_userId" ON "user_credits" ("userId")
    `);

    await queryRunner.query(`
      ALTER TABLE "user_credits"
        ADD CONSTRAINT "FK_user_credits_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // ── credit_transactions table ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "credit_transactions" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"        uuid NOT NULL,
        "type"          varchar(30)  NOT NULL,
        "creditType"    varchar(10)  NOT NULL,
        "amount"        decimal(20,8) NOT NULL,
        "balanceAfter"  decimal(20,8) NOT NULL,
        "remaining"     decimal(20,8),
        "referenceType" varchar(30),
        "referenceId"   varchar(255),
        "description"   varchar(500),
        "adminId"       uuid,
        "expiresAt"     TIMESTAMP WITH TIME ZONE,
        "expired"       boolean NOT NULL DEFAULT false,
        "extended"      boolean NOT NULL DEFAULT false,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_credit_transactions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_credit_tx_user_date" ON "credit_transactions" ("userId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_credit_tx_user_type_expired" ON "credit_transactions" ("userId", "creditType", "expired")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_credit_tx_ref" ON "credit_transactions" ("referenceType", "referenceId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_credit_tx_expiry" ON "credit_transactions" ("expiresAt") WHERE "expired" = false
    `);

    await queryRunner.query(`
      ALTER TABLE "credit_transactions"
        ADD CONSTRAINT "FK_credit_tx_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // ── credit_topups table ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "credit_topups" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"      uuid NOT NULL,
        "amountEur"   decimal(20,8) NOT NULL,
        "status"      varchar(20)  NOT NULL DEFAULT 'pending',
        "paymentId"   uuid,
        "confirmedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_credit_topups" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_credit_topups_user" ON "credit_topups" ("userId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_credit_topups_status" ON "credit_topups" ("status")
    `);

    await queryRunner.query(`
      ALTER TABLE "credit_topups"
        ADD CONSTRAINT "FK_credit_topups_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "credit_topups"
        ADD CONSTRAINT "FK_credit_topups_payment"
        FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL
    `);

    // ── Add credit columns to orders ──────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD COLUMN "creditsUsed"      decimal(20,8) DEFAULT 0,
        ADD COLUMN "creditsPromoUsed" decimal(20,8) DEFAULT 0,
        ADD COLUMN "creditsCashUsed"  decimal(20,8) DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove order columns
    await queryRunner.query(`
      ALTER TABLE "orders"
        DROP COLUMN IF EXISTS "creditsCashUsed",
        DROP COLUMN IF EXISTS "creditsPromoUsed",
        DROP COLUMN IF EXISTS "creditsUsed"
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "credit_topups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "credit_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_credits"`);
  }
}

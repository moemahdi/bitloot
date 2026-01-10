import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Level 7 Migration: Create user sessions table for session management
 * Enables "Active Sessions" feature in user dashboard
 */
export class CreateUserSessions1768000000000 implements MigrationInterface {
  name = 'CreateUserSessions1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_sessions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "refreshTokenHash" varchar NOT NULL,
        "deviceInfo" varchar,
        "userAgent" varchar(500),
        "ipAddress" varchar,
        "location" varchar,
        "lastActiveAt" TIMESTAMP WITH TIME ZONE,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "isRevoked" boolean NOT NULL DEFAULT false,
        "revokedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "fk_session_user" FOREIGN KEY ("userId") 
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for efficient queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_user_revoked" 
      ON "user_sessions" ("userId", "isRevoked")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_expires" 
      ON "user_sessions" ("expiresAt")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_sessions_refresh_token" 
      ON "user_sessions" ("refreshTokenHash")
    `);

    console.log('✅ Created user_sessions table with indexes');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_sessions" CASCADE`);
    console.log('✅ Dropped user_sessions table');
  }
}

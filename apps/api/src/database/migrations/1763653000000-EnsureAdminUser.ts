import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsureAdminUser1763653000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const email = 'blockvibe.fun@gmail.com';
        
        // Check if user exists
        const user = await queryRunner.query(
            `SELECT id FROM "users" WHERE "email" = '${email}'`
        );

        if (user && user.length > 0) {
            // Update existing user
            await queryRunner.query(
                `UPDATE "users" SET "role" = 'admin' WHERE "email" = '${email}'`
            );
        } else {
            // Insert new user
            // We let postgres generate the UUID using the default value
            await queryRunner.query(
                `INSERT INTO "users" ("email", "role", "emailConfirmed") VALUES ('${email}', 'admin', true)`
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const email = 'blockvibe.fun@gmail.com';
        await queryRunner.query(
            `UPDATE "users" SET "role" = 'user' WHERE "email" = '${email}'`
        );
    }

}

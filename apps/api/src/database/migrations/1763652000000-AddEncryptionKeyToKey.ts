import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEncryptionKeyToKey1763652000000 implements MigrationInterface {
    name = 'AddEncryptionKeyToKey1763652000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "keys" ADD "encryptionKey" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "keys" DROP COLUMN "encryptionKey"`);
    }
}

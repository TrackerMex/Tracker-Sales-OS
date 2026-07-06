import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusAndActivityHistoryToActivities1750386000000 implements MigrationInterface {
  name = 'AddStatusAndActivityHistoryToActivities1750386000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "status" varchar NOT NULL DEFAULT 'Pendiente'`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "activity_history" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN IF EXISTS "activity_history"`);
    await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN IF EXISTS "status"`);
  }
}

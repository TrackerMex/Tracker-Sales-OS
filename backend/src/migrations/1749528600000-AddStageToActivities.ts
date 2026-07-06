import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStageToActivities1749528600000 implements MigrationInterface {
  name = 'AddStageToActivities1749528600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "stage" varchar NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN IF EXISTS "stage"`);
  }
}

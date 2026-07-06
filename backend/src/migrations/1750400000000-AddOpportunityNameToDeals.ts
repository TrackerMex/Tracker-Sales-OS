import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOpportunityNameToDeals1750400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "opportunity_name" character varying(200)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deals" DROP COLUMN IF EXISTS "opportunity_name"`,
    );
  }
}

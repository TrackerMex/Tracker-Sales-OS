import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTaskTitleToText1782259200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "title" TYPE TEXT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "title" TYPE VARCHAR(200)`,
    );
  }
}

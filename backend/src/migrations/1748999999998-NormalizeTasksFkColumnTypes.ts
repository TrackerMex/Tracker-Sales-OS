import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Prod drift fix: tasks.seller_id and tasks.client_id were created as varchar
 * by an old synchronize run, while fresh databases (and the baseline CREATE
 * TABLE) define them as uuid. The baseline FKs to sellers/clients cannot be
 * implemented over varchar columns, so this migration normalizes the types
 * BEFORE the baseline runs (its timestamp is lower on purpose).
 *
 * Idempotent: each ALTER only runs when the column is still varchar, so it is
 * a no-op on databases already using uuid. Values were verified castable
 * (valid uuid strings or NULL); NULLIF guards empty strings on the nullable
 * column.
 */
export class NormalizeTasksFkColumnTypes1748999999998
  implements MigrationInterface
{
  name = 'NormalizeTasksFkColumnTypes1748999999998';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'tasks'
            AND column_name = 'seller_id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "tasks"
            ALTER COLUMN "seller_id" TYPE uuid USING "seller_id"::uuid;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'tasks'
            AND column_name = 'client_id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "tasks"
            ALTER COLUMN "client_id" TYPE uuid
            USING NULLIF("client_id", '')::uuid;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "client_id" TYPE character varying USING "client_id"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "seller_id" TYPE character varying USING "seller_id"::text`,
    );
  }
}

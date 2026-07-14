import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillInitiatedClientDeals1783700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "deals" (
        "id", "client_id", "client_name", "seller_id", "stage", "amount",
        "probability", "stage_history", "opportunity_name", "created_at",
        "updated_at", "deleted_at", "version"
      )
      SELECT
        uuid_generate_v4(), c."id", c."name", c."seller_id",
        c."stage"::text::"public"."deals_stage_enum",
        c."expected_amount",
        CASE c."stage"::text
          WHEN 'Prospecto' THEN 5
          WHEN 'Contactado' THEN 15
          WHEN 'Interesado' THEN 30
          WHEN 'Propuesta' THEN 50
          WHEN 'Negociación' THEN 70
          WHEN 'Cierre' THEN 90
          WHEN 'Perdido' THEN 0
          ELSE 5
        END,
        '[]'::jsonb, NULL, NOW(), NOW(), NULL, 1
      FROM "clients" c
      WHERE c."deleted_at" IS NULL
        AND EXISTS (
          SELECT 1
          FROM "activities" a
          WHERE a."client_id" = c."id"
            AND a."seller_id" = c."seller_id"
            AND a."deleted_at" IS NULL
        )
        AND NOT EXISTS (
          SELECT 1
          FROM "deals" d
          WHERE d."client_id" = c."id"
            AND d."seller_id" = c."seller_id"
            AND d."deleted_at" IS NULL
        )
    `);
  }

  public down(): Promise<void> {
    // Conservative no-op: backfilled rows are indistinguishable from deals
    // created normally and deleting them could remove legitimate pipeline data.
    return Promise.resolve();
  }
}

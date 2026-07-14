import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea la tabla `refresh_tokens` (feature 63-refresh-tokens).
 *
 * Escrita a mano siguiendo el patrón idempotente del repo (no hay acceso a
 * una DB para correr `migration:generate` en este entorno): CREATE TABLE
 * IF NOT EXISTS / CREATE INDEX IF NOT EXISTS / DO $$ ... EXCEPTION WHEN
 * duplicate_object THEN null; END $$; para la FK. Segura de correr sin
 * importar el estado previo del schema.
 *
 * Sin columna `deleted_at`: el ciclo de vida de un refresh token es
 * revocación (`revoked_at`), no soft-delete.
 */
export class CreateRefreshTokens1784032100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`,
    );

    await queryRunner.query(`DO $$ BEGIN
      ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT IF EXISTS "FK_refresh_tokens_user_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
  }
}

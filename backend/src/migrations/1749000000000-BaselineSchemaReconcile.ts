import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migracion baseline generada con `migration:generate` contra una DB vacia
 * (schema real reconstruido desde las entidades TypeORM actuales, incluyendo
 * columnas creadas historicamente via TYPEORM_SYNCHRONIZE=true que nunca
 * tuvieron migracion propia: activities.task_id, activities.contact_id,
 * tasks.type, tasks.contact_id).
 *
 * Todos los statements son idempotentes (IF NOT EXISTS / DO-block con
 * catch de duplicate_object) porque el estado real de cada entorno
 * (dev local, prod) es desconocido de antemano — dev tenia todo creado
 * via sync sin fila en `migrations`, y no hay acceso directo a prod para
 * verificar su estado. Es seguro correr esta migracion sin importar si
 * las tablas/columnas ya existen.
 */
export class BaselineSchemaReconcile1749000000000
  implements MigrationInterface
{
  name = 'BaselineSchemaReconcile1749000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "sellers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "profile" text, "user_id" uuid, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_97337ccbf692c58e6c7682de8a2" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "client_id" uuid NOT NULL, "name" character varying NOT NULL, "role" character varying NOT NULL DEFAULT '', "phone" character varying NOT NULL DEFAULT '', "email" character varying NOT NULL DEFAULT '', "is_decision_maker" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_contacts_client_id" ON "contacts" ("client_id")`,
    );

    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."clients_type_enum" AS ENUM('Nuevo', 'Existente', 'Prospecto');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."clients_person_enum" AS ENUM('Moral', 'Física');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."clients_source_enum" AS ENUM('Prospección propia', 'Cliente existente', 'Referido', 'Expo', 'Marketing', 'LinkedIn', 'Web', 'Dirección Comercial');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."clients_stage_enum" AS ENUM('Prospecto', 'Contactado', 'Interesado', 'Propuesta', 'Negociación', 'Cierre', 'Perdido');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "domain" text, "type" "public"."clients_type_enum" NOT NULL, "person" "public"."clients_person_enum" NOT NULL, "seller_id" uuid NOT NULL, "source" "public"."clients_source_enum" NOT NULL, "stage" "public"."clients_stage_enum" NOT NULL DEFAULT 'Prospecto', "expected_amount" numeric(14,2) NOT NULL DEFAULT '0', "units" integer NOT NULL DEFAULT '0', "pain" text, "provider" text, "next_step" text, "next_date" date, "next_time" TIME, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_clients_seller_stage" ON "clients" ("seller_id", "stage")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_clients_seller_id" ON "clients" ("seller_id")`,
    );

    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."activities_type_enum" AS ENUM('Chat', 'WhatsApp', 'Correo', 'Llamada', 'Videoconferencia', 'Reunión virtual', 'Visita física', 'Reunión presencial', 'Propuesta', 'Seguimiento', 'Cierre', 'Solicitud de factura/servicio', 'Junta interna', 'Prospección');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."activities_result_enum" AS ENUM('Interesado', 'No contestó', 'Solicita propuesta', 'Solicita reunión', 'Negociación', 'Cierre ganado', 'Cierre perdido', 'Información enviada');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_id" uuid NOT NULL, "client_id" uuid, "contact_id" character varying, "task_id" character varying, "type" "public"."activities_type_enum" NOT NULL, "result" "public"."activities_result_enum" NOT NULL, "summary" text NOT NULL, "discovery" text, "agreement" text, "next_step" text, "next_objective" text, "next_date" character varying, "next_time" character varying, "points" integer NOT NULL, "quality" integer NOT NULL, "stage" character varying, "status" character varying NOT NULL DEFAULT 'Pendiente', "activity_history" jsonb NOT NULL DEFAULT '[]', "executed_at" TIMESTAMP WITH TIME ZONE NOT NULL, "programmed_at" TIMESTAMP WITH TIME ZONE, "captured_at" TIMESTAMP WITH TIME ZONE NOT NULL, "delay_minutes" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "contact_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "task_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "next_objective" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "stage" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT 'Pendiente'`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "activity_history" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_activities_client_id" ON "activities" ("client_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_activities_seller_id" ON "activities" ("seller_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_activities_executed_at" ON "activities" ("executed_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_activities_seller_executed" ON "activities" ("seller_id", "executed_at")`,
    );

    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."deals_stage_enum" AS ENUM('Prospecto', 'Contactado', 'Interesado', 'Propuesta', 'Negociación', 'Cierre', 'Perdido');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "deals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "client_id" uuid NOT NULL, "client_name" character varying, "seller_id" uuid NOT NULL, "stage" "public"."deals_stage_enum" NOT NULL, "amount" numeric(15,2) NOT NULL DEFAULT '0', "probability" integer NOT NULL DEFAULT '5', "stage_history" jsonb NOT NULL DEFAULT '[]', "opportunity_name" character varying(200), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_8c66f03b250f613ff8615940b4b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "opportunity_name" character varying(200)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_deals_client_id" ON "deals" ("client_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_deals_stage" ON "deals" ("stage")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_deals_client_seller" ON "deals" ("client_id", "seller_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_deals_seller_id" ON "deals" ("seller_id")`,
    );

    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."users_role_enum" AS ENUM('Admin', 'Director', 'Seller');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "password_hash" character varying NOT NULL, "name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'Seller', "seller_id" uuid, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."tasks_status_enum" AS ENUM('Pendiente', 'Completado');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_id" uuid NOT NULL, "client_id" uuid, "type" character varying(50), "contact_id" character varying, "title" text NOT NULL, "description" text, "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL, "completed_at" TIMESTAMP WITH TIME ZONE, "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'Pendiente', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "type" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "contact_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "title" TYPE TEXT`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tasks_seller_id" ON "tasks" ("seller_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tasks_seller_scheduled" ON "tasks" ("seller_id", "scheduled_at")`,
    );

    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."sales_pay_enum" AS ENUM('Pagado', 'Crédito', '50% anticipo', 'Pendiente');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."sales_source_enum" AS ENUM('Prospección propia', 'Cliente existente', 'Referido', 'Expo', 'Marketing', 'LinkedIn', 'Web', 'Dirección Comercial');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."sales_type_enum" AS ENUM('seller', 'atc', 'direction');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "sales" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_id" uuid NOT NULL, "client_id" uuid, "client_name" character varying NOT NULL, "client_type" character varying NOT NULL, "product" character varying NOT NULL, "units" integer NOT NULL, "amount" numeric(15,2) NOT NULL, "pay" "public"."sales_pay_enum" NOT NULL, "source" "public"."sales_source_enum" NOT NULL, "type" "public"."sales_type_enum" NOT NULL, "date" date NOT NULL, "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_sales_client_id" ON "sales" ("client_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_sales_seller_id" ON "sales" ("seller_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "value" jsonb NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c8639b7626fa94ba8265628f214" UNIQUE ("key"), CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "action" character varying(50) NOT NULL, "entity_name" character varying(100) NOT NULL, "entity_id" uuid, "old_values" jsonb, "new_values" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "audit_logs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity" ON "audit_logs" ("entity_name", "entity_id")`,
    );

    const fks: Array<[string, string, string]> = [
      [
        'contacts',
        'FK_72d1013c43a0198e905290831e5',
        'ALTER TABLE "contacts" ADD CONSTRAINT "FK_72d1013c43a0198e905290831e5" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
      ],
      [
        'clients',
        'FK_996b37cdada724a6d0ba1aea981',
        'ALTER TABLE "clients" ADD CONSTRAINT "FK_996b37cdada724a6d0ba1aea981" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION',
      ],
      [
        'activities',
        'FK_7e2fd91d279f401e90be817a135',
        'ALTER TABLE "activities" ADD CONSTRAINT "FK_7e2fd91d279f401e90be817a135" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION',
      ],
      [
        'activities',
        'FK_8aa3b964a575c4eb670bbe0a89d',
        'ALTER TABLE "activities" ADD CONSTRAINT "FK_8aa3b964a575c4eb670bbe0a89d" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION',
      ],
      [
        'deals',
        'FK_7a1770366da1de36b1efc628073',
        'ALTER TABLE "deals" ADD CONSTRAINT "FK_7a1770366da1de36b1efc628073" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION',
      ],
      [
        'deals',
        'FK_5a0726b1c4db7f2ddb57b441f71',
        'ALTER TABLE "deals" ADD CONSTRAINT "FK_5a0726b1c4db7f2ddb57b441f71" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION',
      ],
      [
        'tasks',
        'FK_3be765e4b852d1403680ef324fe',
        'ALTER TABLE "tasks" ADD CONSTRAINT "FK_3be765e4b852d1403680ef324fe" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION',
      ],
      [
        'tasks',
        'FK_928436d97a43697186374c4ef77',
        'ALTER TABLE "tasks" ADD CONSTRAINT "FK_928436d97a43697186374c4ef77" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION',
      ],
      [
        'sales',
        'FK_fbcb737b3ecc7c968b0dc167122',
        'ALTER TABLE "sales" ADD CONSTRAINT "FK_fbcb737b3ecc7c968b0dc167122" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION',
      ],
      [
        'sales',
        'FK_c49d95226945ca3a93584f912ca',
        'ALTER TABLE "sales" ADD CONSTRAINT "FK_c49d95226945ca3a93584f912ca" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION',
      ],
    ];

    for (const [, , sql] of fks) {
      await queryRunner.query(`DO $$ BEGIN
        ${sql};
      EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const fkNames: Array<[string, string]> = [
      ['sales', 'FK_c49d95226945ca3a93584f912ca'],
      ['sales', 'FK_fbcb737b3ecc7c968b0dc167122'],
      ['tasks', 'FK_928436d97a43697186374c4ef77'],
      ['tasks', 'FK_3be765e4b852d1403680ef324fe'],
      ['deals', 'FK_5a0726b1c4db7f2ddb57b441f71'],
      ['deals', 'FK_7a1770366da1de36b1efc628073'],
      ['activities', 'FK_8aa3b964a575c4eb670bbe0a89d'],
      ['activities', 'FK_7e2fd91d279f401e90be817a135'],
      ['clients', 'FK_996b37cdada724a6d0ba1aea981'],
      ['contacts', 'FK_72d1013c43a0198e905290831e5'],
    ];
    for (const [table, fk] of fkNames) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${fk}"`,
      );
    }

    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sales"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."sales_type_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."sales_source_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."sales_pay_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tasks"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."tasks_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "deals"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."deals_stage_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activities"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."activities_result_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."activities_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "clients"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."clients_stage_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."clients_source_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."clients_person_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."clients_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "contacts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sellers"`);
  }
}

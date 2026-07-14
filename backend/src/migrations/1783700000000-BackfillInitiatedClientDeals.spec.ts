import { QueryRunner } from 'typeorm';
import { BackfillInitiatedClientDeals1783700000000 } from './1783700000000-BackfillInitiatedClientDeals';

describe('BackfillInitiatedClientDeals1783700000000', () => {
  it('backfills only active initiated clients and ignores only active deals', async () => {
    const queries: string[] = [];
    const query = jest.fn((sql: string): Promise<unknown> => {
      queries.push(sql);
      return Promise.resolve(undefined);
    });
    const queryRunner = { query } as unknown as QueryRunner;

    await new BackfillInitiatedClientDeals1783700000000().up(queryRunner);

    const sql = (queries[0] ?? '').replace(/\s+/g, ' ');
    expect(sql).toContain('c."deleted_at" IS NULL');
    expect(sql).toContain('a."client_id" = c."id"');
    expect(sql).toContain('a."seller_id" = c."seller_id"');
    expect(sql).toContain('a."deleted_at" IS NULL');
    expect(sql).toContain('d."client_id" = c."id"');
    expect(sql).toContain('d."seller_id" = c."seller_id"');
    expect(sql).toContain('d."deleted_at" IS NULL');
    expect(sql).toContain('c."expected_amount"');
  });

  it('is structurally idempotent through NOT EXISTS on active deals', async () => {
    const queries: string[] = [];
    const query = jest.fn((sql: string): Promise<unknown> => {
      queries.push(sql);
      return Promise.resolve(undefined);
    });
    const queryRunner = { query } as unknown as QueryRunner;
    const migration = new BackfillInitiatedClientDeals1783700000000();

    await migration.up(queryRunner);
    await migration.up(queryRunner);

    for (const sql of queries) {
      expect(sql).toMatch(/NOT EXISTS\s*\([\s\S]*?FROM "deals"/);
      expect(sql).toMatch(/d\."deleted_at" IS NULL/);
    }
  });
});

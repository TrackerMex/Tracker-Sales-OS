import { QueryRunner } from 'typeorm';
import { BackfillInitiatedClientDeals1783700000000 } from './1783700000000-BackfillInitiatedClientDeals';

describe('BackfillInitiatedClientDeals1783700000000', () => {
  it('backfills only active initiated clients and ignores only active deals', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await new BackfillInitiatedClientDeals1783700000000().up(queryRunner);

    const sql = String(query.mock.calls[0][0]).replace(/\s+/g, ' ');
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
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;
    const migration = new BackfillInitiatedClientDeals1783700000000();

    await migration.up(queryRunner);
    await migration.up(queryRunner);

    for (const [sql] of query.mock.calls) {
      expect(String(sql)).toMatch(/NOT EXISTS\s*\([\s\S]*?FROM "deals"/);
      expect(String(sql)).toMatch(/d\."deleted_at" IS NULL/);
    }
  });
});

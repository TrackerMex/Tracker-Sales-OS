import { Repository } from 'typeorm';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { ClientTypeormEntity } from '../../../clients/infrastructure/entities/client.typeorm.entity';
import { ContactTypeormEntity } from '../../../clients/infrastructure/entities/contact.typeorm.entity';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import { DealTypeormEntity } from '../entities/deal.typeorm.entity';
import { DealRepositoryImpl } from './deal.repository.impl';

const makeRepository = () => {
  const query = jest.fn();
  const dealRepo = {
    manager: { query },
  } as unknown as Repository<DealTypeormEntity>;

  return {
    repository: new DealRepositoryImpl(
      dealRepo,
      {} as Repository<ClientTypeormEntity>,
      {} as Repository<ContactTypeormEntity>,
      {} as Repository<SellerTypeormEntity>,
    ),
    query,
  };
};

describe('DealRepositoryImpl.findStalledDeals', () => {
  it('emits matching count/data filters and paginates the second page in SQL', async () => {
    const { repository, query } = makeRepository();
    query.mockResolvedValueOnce([{ total: 13 }]).mockResolvedValueOnce([
      {
        id: 'deal-11',
        client_id: 'client-11',
        client_name: 'Cliente 11',
        seller_id: 'seller-1',
        stage: PipelineStage.Propuesta,
        amount: '1500.50',
        probability: '50',
        stage_history: [],
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        updated_at: new Date('2026-01-10T00:00:00.000Z'),
        deleted_at: null,
        days_stalled: '18',
      },
    ]);

    const result = await repository.findStalledDeals(7, 2, 10);

    expect(query).toHaveBeenCalledTimes(2);
    const [countSql, countParams] = query.mock.calls[0] as [string, unknown[]];
    const [dataSql, dataParams] = query.mock.calls[1] as [string, unknown[]];

    for (const sql of [countSql, dataSql]) {
      expect(sql).toContain('d.deleted_at IS NULL');
      expect(sql).toContain("d.stage NOT IN ('Cierre', 'Perdido')");
      expect(sql).toContain('WHERE days_stalled >= $1');
    }
    expect(countParams).toEqual([7]);
    expect(dataParams).toEqual([7, 10, 10]);
    expect(dataSql).toContain('ORDER BY days_stalled DESC, id ASC');
    expect(dataSql).toContain('OFFSET $2 LIMIT $3');
    expect(result.total).toBe(13);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      daysStalled: 18,
      deal: {
        id: 'deal-11',
        clientId: 'client-11',
        amount: 1500.5,
        probability: 50,
      },
    });
  });

  it('returns the real total with empty data when the requested page is out of range', async () => {
    const { repository, query } = makeRepository();
    query.mockResolvedValueOnce([{ total: '11' }]).mockResolvedValueOnce([]);

    const result = await repository.findStalledDeals(7, 5, 10);

    const [, dataParams] = query.mock.calls[1] as [string, unknown[]];
    expect(dataParams).toEqual([7, 40, 10]);
    expect(result).toEqual({ data: [], total: 11 });
  });
});

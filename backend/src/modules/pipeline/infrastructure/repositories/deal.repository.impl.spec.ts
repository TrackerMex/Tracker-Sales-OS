import { In, IsNull, Repository } from 'typeorm';
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
        client_name: 'Cliente persistido',
        seller_id: 'seller-1',
        seller_name: 'Vendedor persistido',
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
      expect(sql).toContain('LEFT JOIN clients c ON c.id = d.client_id');
      expect(sql).toContain('LEFT JOIN sellers s ON s.id = d.seller_id');
      expect(sql).toContain(
        "COALESCE(NULLIF(TRIM(c.name), ''), NULLIF(TRIM(d.client_name), ''), '') AS client_name",
      );
      expect(sql).toContain(
        "COALESCE(NULLIF(TRIM(s.name), ''), '') AS seller_name",
      );
    }
    expect(countParams).toEqual([7]);
    expect(dataParams).toEqual([7, 10, 10]);
    expect(dataSql).toContain('ORDER BY days_stalled DESC, id ASC');
    expect(dataSql).toContain('OFFSET $2 LIMIT $3');
    expect(result.total).toBe(13);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      daysStalled: 18,
      clientName: 'Cliente persistido',
      sellerName: 'Vendedor persistido',
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

describe('DealRepositoryImpl detailed pipeline', () => {
  it.each(['personal', 'team'])(
    'excludes deleted or missing clients in %s without modifying deal history',
    async (mode) => {
      const history = [{ oldStage: 'Prospecto', newStage: 'Contactado' }];
      const deals = [
        { id: 'active-deal', clientId: 'active-client', stageHistory: history },
        { id: 'deleted-client-deal', clientId: 'deleted-client' },
        { id: 'missing-client-deal', clientId: 'missing-client' },
      ].map((deal) =>
        Object.assign(new DealTypeormEntity(), {
          ...deal,
          sellerId: 'seller-1',
          amount: 100,
          probability: 20,
        }),
      );
      const find = jest.fn().mockResolvedValue(deals);
      const softDelete = jest.fn();
      const findBy = jest
        .fn()
        .mockResolvedValue([
          { id: 'active-client', name: 'Cliente activo', nextStep: 'Llamar' },
        ]);
      const contactsQuery = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      const repository = new DealRepositoryImpl(
        { find, softDelete } as unknown as Repository<DealTypeormEntity>,
        { findBy } as unknown as Repository<ClientTypeormEntity>,
        {
          createQueryBuilder: jest.fn().mockReturnValue(contactsQuery),
        } as unknown as Repository<ContactTypeormEntity>,
        {
          findBy: jest
            .fn()
            .mockResolvedValue([{ id: 'seller-1', name: 'Dueño' }]),
        } as unknown as Repository<SellerTypeormEntity>,
      );

      const result =
        mode === 'personal'
          ? await repository.findDetailedBySellerId('seller-1')
          : await repository.findDetailedAllSellers();

      expect(find).toHaveBeenCalledWith({
        where: {
          ...(mode === 'personal' ? { sellerId: 'seller-1' } : {}),
          deletedAt: IsNull(),
        },
        order: { createdAt: 'DESC' },
      });
      expect(findBy).toHaveBeenCalledWith({
        id: In(['active-client', 'deleted-client', 'missing-client']),
        deletedAt: IsNull(),
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        deal: { id: 'active-deal', stageHistory: history },
        clientName: 'Cliente activo',
        clientNextStep: 'Llamar',
      });
      expect(deals).toHaveLength(3);
      expect(deals[0].stageHistory).toBe(history);
      expect(softDelete).not.toHaveBeenCalled();
    },
  );
});

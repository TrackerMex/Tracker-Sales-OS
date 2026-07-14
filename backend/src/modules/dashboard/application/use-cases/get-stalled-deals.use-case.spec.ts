import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { DealEntity } from '../../../pipeline/domain/entities/deal.entity';
import { IDealsRepository } from '../../../pipeline/domain/repositories/deal.repository.interface';
import { GetSettingsUseCase } from '../../../settings/application/use-cases/get-settings.use-case';
import { GetStalledDealsUseCase } from './get-stalled-deals.use-case';

const makeDeal = (id: string): DealEntity =>
  Object.assign(new DealEntity(), {
    id,
    clientId: `client-${id}`,
    clientName: `Client ${id}`,
    sellerId: 'seller-1',
    stage: PipelineStage.Propuesta,
    amount: 1000,
    probability: 50,
    stageHistory: [],
    opportunityName: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  });

const makeUseCase = (
  result: Awaited<ReturnType<IDealsRepository['findStalledDeals']>>,
) => {
  const findStalledDeals = jest.fn().mockResolvedValue(result);
  const dealRepo = {
    findStalledDeals,
  } as unknown as jest.Mocked<IDealsRepository>;
  const getSettings = {
    execute: jest.fn().mockResolvedValue({
      stalledAmberDays: 7,
      stalledRedDays: 14,
    }),
  } as unknown as GetSettingsUseCase;

  return {
    useCase: new GetStalledDealsUseCase(dealRepo, getSettings),
    findStalledDeals,
  };
};

describe('GetStalledDealsUseCase', () => {
  it('uses page 1 and limit 10 by default', async () => {
    const { useCase, findStalledDeals } = makeUseCase({ data: [], total: 0 });

    const result = await useCase.execute({});

    expect(findStalledDeals).toHaveBeenCalledWith(7, 1, 10);
    expect(result).toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  });

  it('requests and reports the second page', async () => {
    const { useCase, findStalledDeals } = makeUseCase({
      data: [
        {
          deal: makeDeal('deal-3'),
          daysStalled: 10,
          clientName: 'Cliente resuelto',
          sellerName: 'Vendedor resuelto',
        },
      ],
      total: 3,
    });

    const result = await useCase.execute({ page: 2, limit: 2 });

    expect(findStalledDeals).toHaveBeenCalledWith(7, 2, 2);
    expect(result).toMatchObject({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      clientName: 'Cliente resuelto',
      sellerName: 'Vendedor resuelto',
    });
  });

  it('preserves repository order and calculates severity from settings', async () => {
    const { useCase } = makeUseCase({
      data: [
        {
          deal: makeDeal('deal-b'),
          daysStalled: 20,
          clientName: 'Cliente B',
          sellerName: 'Vendedor B',
        },
        {
          deal: makeDeal('deal-a'),
          daysStalled: 14,
          clientName: 'Cliente A',
          sellerName: 'Vendedor A',
        },
        {
          deal: makeDeal('deal-c'),
          daysStalled: 8,
          clientName: 'Cliente C',
          sellerName: 'Vendedor C',
        },
      ],
      total: 23,
    });

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.data.map(({ dealId }) => dealId)).toEqual([
      'deal-b',
      'deal-a',
      'deal-c',
    ]);
    expect(result.data.map(({ severity }) => severity)).toEqual([
      'red',
      'red',
      'amber',
    ]);
    expect(result.totalPages).toBe(3);
  });

  it('returns empty data with consistent metadata for an out-of-range page', async () => {
    const { useCase } = makeUseCase({ data: [], total: 11 });

    const result = await useCase.execute({ page: 5, limit: 10 });

    expect(result).toEqual({
      data: [],
      total: 11,
      page: 5,
      limit: 10,
      totalPages: 2,
    });
  });
});

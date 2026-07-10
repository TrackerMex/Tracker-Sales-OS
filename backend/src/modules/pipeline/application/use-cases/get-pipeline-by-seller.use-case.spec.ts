import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { DealEntity } from '../../domain/entities/deal.entity';
import { IDealsRepository } from '../../domain/repositories/deal.repository.interface';
import { GetPipelineBySellerUseCase } from './get-pipeline-by-seller.use-case';

const makeMockDealRepo = (): jest.Mocked<IDealsRepository> => ({
  create: jest.fn(), findById: jest.fn(), findAll: jest.fn(), update: jest.fn(),
  softDelete: jest.fn(), findBySellerId: jest.fn(), findByStage: jest.fn(),
  findByClientIdAndSellerId: jest.fn(), findAllByClientAndSeller: jest.fn(),
  findByOpportunity: jest.fn(), findDetailedBySellerId: jest.fn(),
  findDetailedAllSellers: jest.fn(), getWeightedForecast: jest.fn(),
  findStalledDeals: jest.fn(), findAllForAnalysis: jest.fn(),
});

describe('GetPipelineBySellerUseCase', () => {
  it('returns 49 distinct clients without truncating a stage above 20 rows', async () => {
    const dealRepo = makeMockDealRepo();
    const sellerId = '00000000-0000-0000-0000-000000000001';
    const rows = Array.from({ length: 49 }, (_, index) => {
      const deal = Object.assign(new DealEntity(), {
        id: `deal-${index}`,
        clientId: `client-${index}`,
        clientName: `Cliente ${index}`,
        sellerId,
        stage: index < 25 ? PipelineStage.Contactado : PipelineStage.Interesado,
        amount: 0,
        probability: index < 25 ? 15 : 30,
        stageHistory: [],
        opportunityName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      return {
        deal,
        clientName: deal.clientName,
        contactName: null,
        contactRole: null,
        painPoint: null,
        sellerName: 'Seller',
        clientNextStep: null,
        clientNextDate: null,
        clientNextTime: null,
      };
    });
    dealRepo.findDetailedBySellerId.mockResolvedValue(rows);
    const useCase = new GetPipelineBySellerUseCase(dealRepo);

    const result = await useCase.execute({ sellerId });
    const allDeals = Object.values(result).flat();

    expect(allDeals).toHaveLength(49);
    expect(new Set(allDeals.map((deal) => deal.clientId)).size).toBe(49);
    expect(result[PipelineStage.Contactado]).toHaveLength(25);
    expect(dealRepo.findDetailedBySellerId).toHaveBeenCalledWith(sellerId);
  });
});

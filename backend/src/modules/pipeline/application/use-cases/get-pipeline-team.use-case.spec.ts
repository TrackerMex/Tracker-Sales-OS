import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { DealEntity } from '../../domain/entities/deal.entity';
import { IDealsRepository } from '../../domain/repositories/deal.repository.interface';
import { GetPipelineTeamUseCase } from './get-pipeline-team.use-case';

const makeRepo = (): jest.Mocked<IDealsRepository> => ({
  create: jest.fn(), findById: jest.fn(), findAll: jest.fn(), update: jest.fn(),
  softDelete: jest.fn(), findBySellerId: jest.fn(), findByStage: jest.fn(),
  findByClientIdAndSellerId: jest.fn(), findAllByClientAndSeller: jest.fn(),
  findByOpportunity: jest.fn(), findDetailedBySellerId: jest.fn(),
  findDetailedAllSellers: jest.fn(), getWeightedForecast: jest.fn(),
  findStalledDeals: jest.fn(), findAllForAnalysis: jest.fn(),
});

describe('GetPipelineTeamUseCase', () => {
  it('returns all 49 initiated client deals without truncating above 20 per stage', async () => {
    const repo = makeRepo();
    repo.findDetailedAllSellers.mockResolvedValue(
      Array.from({ length: 49 }, (_, index) => {
        const deal = Object.assign(new DealEntity(), {
          id: `deal-${index}`,
          clientId: `client-${index}`,
          clientName: `Cliente ${index}`,
          sellerId: `seller-${index % 2}`,
          stage: index < 30 ? PipelineStage.Prospecto : PipelineStage.Contactado,
          amount: 0,
          probability: 5,
          stageHistory: [],
          opportunityName: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        });
        return {
          deal, clientName: deal.clientName, contactName: null,
          contactRole: null, painPoint: null, sellerName: null,
          clientNextStep: null, clientNextDate: null, clientNextTime: null,
        };
      }),
    );

    const result = await new GetPipelineTeamUseCase(repo).execute();
    const rows = Object.values(result).flat();

    expect(rows).toHaveLength(49);
    expect(new Set(rows.map((row) => row.clientId)).size).toBe(49);
    expect(result[PipelineStage.Prospecto]).toHaveLength(30);
  });
});

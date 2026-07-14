import { BadRequestException } from '@nestjs/common';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { IClientRepository } from '../../../clients/domain/repositories/client.repository.interface';
import {
  ALLOWED_TRANSITIONS,
  DealEntity,
  STAGE_PROBABILITY,
} from '../../domain/entities/deal.entity';
import { IDealsRepository } from '../../domain/repositories/deal.repository.interface';
import { ChangeDealStageUseCase } from './change-deal-stage.use-case';

type MockedMethods<T> = {
  [Key in keyof T]: T[Key] extends (...args: never[]) => unknown
    ? jest.MockedFunction<T[Key]>
    : never;
};

const makeMockDealRepo = (): MockedMethods<IDealsRepository> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  findBySellerId: jest.fn(),
  findByStage: jest.fn(),
  findByClientIdAndSellerId: jest.fn(),
  findAllByClientAndSeller: jest.fn(),
  findByOpportunity: jest.fn(),
  findDetailedBySellerId: jest.fn(),
  findDetailedAllSellers: jest.fn(),
  getWeightedForecast: jest.fn(),
  findStalledDeals: jest.fn(),
  findAllForAnalysis: jest.fn(),
});

const makeMockClientRepo = (): MockedMethods<IClientRepository> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  findBySellerId: jest.fn(),
  findWithFilters: jest.fn(),
  checkDuplicates: jest.fn(),
  addContact: jest.fn(),
  syncContacts: jest.fn(),
});

const makeDeal = (stage: PipelineStage): DealEntity =>
  Object.assign(new DealEntity(), {
    id: 'deal-1',
    clientId: 'client-1',
    clientName: 'Cliente',
    sellerId: 'seller-1',
    stage,
    amount: 1000,
    probability: STAGE_PROBABILITY[stage],
    stageHistory: [],
    opportunityName: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

describe('ChangeDealStageUseCase', () => {
  const stages = Object.values(PipelineStage);

  it('allows every other stage and excludes the current stage in the transition map', () => {
    for (const stage of stages) {
      expect(ALLOWED_TRANSITIONS[stage]).toHaveLength(stages.length - 1);
      expect(ALLOWED_TRANSITIONS[stage]).not.toContain(stage);
      expect(new Set(ALLOWED_TRANSITIONS[stage])).toEqual(
        new Set(stages.filter((candidate) => candidate !== stage)),
      );
    }
  });

  it.each([
    ['a non-adjacent jump', PipelineStage.Prospecto, PipelineStage.Negociacion],
    ['reopening from Cierre', PipelineStage.Cierre, PipelineStage.Contactado],
    ['reopening from Perdido', PipelineStage.Perdido, PipelineStage.Propuesta],
  ])('supports %s', async (_label, from, to) => {
    const dealRepo = makeMockDealRepo();
    const clientRepo = makeMockClientRepo();
    const deal = makeDeal(from);
    dealRepo.findById.mockResolvedValue(deal);
    dealRepo.update.mockImplementation((_id, patch) =>
      Promise.resolve(Object.assign(makeDeal(to), patch)),
    );
    clientRepo.update.mockResolvedValue({} as never);

    const result = await new ChangeDealStageUseCase(
      dealRepo,
      clientRepo,
    ).execute({
      id: deal.id,
      newStage: to,
      changedBy: 'user-1',
    });

    expect(result.stage).toBe(to);
    expect(dealRepo.update).toHaveBeenCalledWith(
      deal.id,
      expect.objectContaining({
        stage: to,
        probability: STAGE_PROBABILITY[to],
        stageHistory: [
          expect.objectContaining({ stage: to, changedBy: 'user-1' }),
        ],
      }),
    );
    expect(clientRepo.update).toHaveBeenCalledWith(deal.clientId, {
      stage: to,
    });
  });

  it('rejects changing to the current stage without persisting changes', async () => {
    const dealRepo = makeMockDealRepo();
    const clientRepo = makeMockClientRepo();
    const deal = makeDeal(PipelineStage.Propuesta);
    dealRepo.findById.mockResolvedValue(deal);

    await expect(
      new ChangeDealStageUseCase(dealRepo, clientRepo).execute({
        id: deal.id,
        newStage: deal.stage,
        changedBy: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(dealRepo.update).not.toHaveBeenCalled();
    expect(clientRepo.update).not.toHaveBeenCalled();
  });
});

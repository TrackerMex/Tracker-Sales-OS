import { BadRequestException } from '@nestjs/common';
import { CreateActivityUseCase } from './create-activity.use-case';
import { ActivityType, ActivityResult } from '../../domain/entities/activity.entity';
import { IActivityRepository } from '../../domain/repositories/activity.repository.interface';
import { IDealsRepository } from '../../../pipeline/domain/repositories/deal.repository.interface';
import { IClientRepository } from '../../../clients/domain/repositories/client.repository.interface';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { ActivityRepositoryImpl } from '../../infrastructure/repositories/activity.repository.impl';

const makeMockRepo = (): jest.Mocked<IActivityRepository> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  findDailyBySeller: jest.fn(),
  sumDailyPoints: jest.fn(),
  findRecentBySeller: jest.fn(),
  sumPointsByDayForSellers: jest.fn(),
  updateStatus: jest.fn(),
  findByClientId: jest.fn(),
  createWithPipelineSync: jest.fn(),
});

const makeMockDealRepo = (): jest.Mocked<IDealsRepository> => ({
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

const baseInput = {
  sellerId: '00000000-0000-0000-0000-000000000001',
  clientId: '00000000-0000-0000-0000-000000000002',
  result: ActivityResult.Interesado,
  summary: 'test',
  executedAt: new Date().toISOString(),
};

describe('CreateActivityUseCase', () => {
  let useCase: CreateActivityUseCase;
  let repo: jest.Mocked<IActivityRepository>;
  let dealRepo: jest.Mocked<IDealsRepository>;
  let clientRepo: jest.Mocked<IClientRepository>;

  beforeEach(() => {
    repo = makeMockRepo();
    repo.createWithPipelineSync.mockImplementation(async (activity) => ({
      ...activity,
      id: 'activity-atomic',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as any));
    dealRepo = makeMockDealRepo();
    dealRepo.findByClientIdAndSellerId.mockResolvedValue({
      id: 'existing-deal', stage: PipelineStage.Contactado,
    } as any);
    clientRepo = {
      create: jest.fn(), findById: jest.fn(), findAll: jest.fn(), update: jest.fn(),
      softDelete: jest.fn(), findBySellerId: jest.fn(), findWithFilters: jest.fn(),
      checkDuplicates: jest.fn(), addContact: jest.fn(), syncContacts: jest.fn(),
    };
    clientRepo.findById.mockResolvedValue({
      id: baseInput.clientId,
      sellerId: baseInput.sellerId,
      name: 'Cliente prueba',
      stage: PipelineStage.Contactado,
      expectedAmount: 1250,
    } as any);
    useCase = new CreateActivityUseCase(repo, dealRepo, clientRepo);
  });

  it('creates one deal from the persisted client stage when the first activity has no stage', async () => {
    repo.create.mockResolvedValue({ ...baseInput, type: ActivityType.Chat, id: 'activity-1' } as any);
    dealRepo.findByClientIdAndSellerId.mockResolvedValue(null);

    await useCase.execute({ ...baseInput, type: ActivityType.Chat });

    expect(repo.createWithPipelineSync).toHaveBeenCalledTimes(1);
    expect(repo.createWithPipelineSync).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      clientId: baseInput.clientId,
      sellerId: baseInput.sellerId,
      clientName: 'Cliente prueba',
      stage: PipelineStage.Contactado,
      amount: 1250,
    }));
    expect(repo.createWithPipelineSync).toHaveBeenCalledWith(
      expect.objectContaining({ stage: PipelineStage.Contactado }),
      expect.any(Object),
    );
  });

  it('prefers the activity stage over the persisted client stage', async () => {
    repo.create.mockResolvedValue({ ...baseInput, type: ActivityType.Chat, id: 'activity-1' } as any);
    dealRepo.findByClientIdAndSellerId.mockResolvedValue(null);

    await useCase.execute({ ...baseInput, type: ActivityType.Chat, stage: PipelineStage.Interesado });

    expect(repo.createWithPipelineSync).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ stage: PipelineStage.Interesado }),
    );
  });

  it('does not create a deal when the client cannot be resolved', async () => {
    repo.create.mockResolvedValue({ ...baseInput, type: ActivityType.Chat, id: 'activity-1' } as any);
    dealRepo.findByClientIdAndSellerId.mockResolvedValue(null);
    clientRepo.findById.mockResolvedValue(null);

    await useCase.execute({ ...baseInput, type: ActivityType.Chat });

    expect(repo.createWithPipelineSync).not.toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate a deal for a later activity or retry', async () => {
    repo.create.mockResolvedValue({ ...baseInput, type: ActivityType.Chat, id: 'activity-1' } as any);
    dealRepo.findByClientIdAndSellerId.mockResolvedValue({
      id: 'deal-1', stage: PipelineStage.Contactado,
    } as any);

    await useCase.execute({ ...baseInput, type: ActivityType.Chat });

    expect(repo.createWithPipelineSync).not.toHaveBeenCalled();
    expect(clientRepo.findById).not.toHaveBeenCalled();
  });

  it('does not create a deal when the activity has no clientId', async () => {
    repo.create.mockResolvedValue({ ...baseInput, clientId: null, type: ActivityType.Prospeccion, id: 'activity-1' } as any);

    await useCase.execute({
      sellerId: baseInput.sellerId,
      type: ActivityType.Prospeccion,
      result: ActivityResult.Interesado,
      summary: 'Prospeccion sin cliente',
      executedAt: baseInput.executedAt,
    });

    expect(repo.createWithPipelineSync).not.toHaveBeenCalled();
    expect(clientRepo.findById).not.toHaveBeenCalled();
  });

  it('does not create a deal under a seller different from the client owner', async () => {
    repo.create.mockResolvedValue({ ...baseInput, type: ActivityType.Chat, id: 'activity-1' } as any);
    clientRepo.findById.mockResolvedValue({
      id: baseInput.clientId,
      sellerId: '00000000-0000-0000-0000-000000000099',
      stage: PipelineStage.Contactado,
    } as any);

    await useCase.execute({ ...baseInput, type: ActivityType.Chat });

    expect(repo.createWithPipelineSync).not.toHaveBeenCalled();
  });

  it('assigns correct points for Chat (1)', async () => {
    const entity = { ...baseInput, type: ActivityType.Chat, points: 1, quality: 0, id: '1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null, contactId: null, discovery: null, agreement: null, nextStep: null, nextDate: null, nextTime: null, programmedAt: null, capturedAt: new Date(), delayMinutes: 0, executedAt: new Date() };
    repo.create.mockResolvedValue(entity as any);
    await useCase.execute({ ...baseInput, type: ActivityType.Chat });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ points: 1 }));
  });

  it('assigns correct points for Llamada (3)', async () => {
    const entity = { ...baseInput, type: ActivityType.Llamada, points: 3, quality: 0, id: '1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null, contactId: null, discovery: null, agreement: null, nextStep: 'call back', nextDate: '2025-01-01', nextTime: '10:00', programmedAt: null, capturedAt: new Date(), delayMinutes: 0, executedAt: new Date() };
    repo.create.mockResolvedValue(entity as any);
    await useCase.execute({ ...baseInput, type: ActivityType.Llamada, nextStep: 'call back', nextDate: '2025-01-01', nextTime: '10:00' });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ points: 3 }));
  });

  it('assigns correct points for Cierre (25)', async () => {
    const entity = { ...baseInput, type: ActivityType.Cierre, points: 25, quality: 0, id: '1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null, contactId: null, discovery: null, agreement: null, nextStep: null, nextDate: null, nextTime: null, programmedAt: null, capturedAt: new Date(), delayMinutes: 0, executedAt: new Date() };
    repo.create.mockResolvedValue(entity as any);
    await useCase.execute({ ...baseInput, type: ActivityType.Cierre });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ points: 25 }));
  });

  it('calculates quality=0 when all fields are empty/short', async () => {
    const entity = { ...baseInput, type: ActivityType.Chat, points: 1, quality: 0, id: '1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null, contactId: null, discovery: null, agreement: null, nextStep: null, nextDate: null, nextTime: null, programmedAt: null, capturedAt: new Date(), delayMinutes: 0, executedAt: new Date() };
    repo.create.mockResolvedValue(entity as any);
    await useCase.execute({ ...baseInput, type: ActivityType.Chat, summary: 'short' });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ quality: 0 }));
  });

  it('calculates quality=100 when all 5 conditions are met', async () => {
    const entity = { ...baseInput, type: ActivityType.Chat, points: 1, quality: 100, id: '1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null, contactId: null, discovery: null, agreement: null, nextStep: null, nextDate: null, nextTime: null, programmedAt: null, capturedAt: new Date(), delayMinutes: 0, executedAt: new Date() };
    repo.create.mockResolvedValue(entity as any);
    await useCase.execute({
      ...baseInput,
      type: ActivityType.Chat,
      summary: 'a'.repeat(21),
      discovery: 'a'.repeat(16),
      agreement: 'a'.repeat(16),
      nextStep: 'a'.repeat(9),
      nextDate: '2025-01-01',
      nextTime: '10:00',
    });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ quality: 100 }));
  });

  it('calculates quality=40 when only summary(>20) + nextDate + nextTime present', async () => {
    const entity = { ...baseInput, type: ActivityType.Chat, points: 1, quality: 40, id: '1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null, contactId: null, discovery: null, agreement: null, nextStep: null, nextDate: null, nextTime: null, programmedAt: null, capturedAt: new Date(), delayMinutes: 0, executedAt: new Date() };
    repo.create.mockResolvedValue(entity as any);
    await useCase.execute({
      ...baseInput,
      type: ActivityType.Chat,
      summary: 'a'.repeat(21),
      nextDate: '2025-01-01',
      nextTime: '10:00',
    });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ quality: 40 }));
  });

  it('throws BadRequestException if type=Llamada and nextStep is missing', async () => {
    await expect(
      useCase.execute({ ...baseInput, type: ActivityType.Llamada }),
    ).rejects.toThrow(BadRequestException);
  });

  it('calculates delayMinutes as positive difference', async () => {
    const pastDate = new Date(Date.now() - 5 * 60 * 1000);
    const entity = { ...baseInput, type: ActivityType.Chat, points: 1, quality: 0, id: '1', createdAt: new Date(), updatedAt: new Date(), deletedAt: null, contactId: null, discovery: null, agreement: null, nextStep: null, nextDate: null, nextTime: null, programmedAt: null, capturedAt: new Date(), delayMinutes: 5, executedAt: pastDate };
    repo.create.mockResolvedValue(entity as any);
    await useCase.execute({ ...baseInput, type: ActivityType.Chat, executedAt: pastDate.toISOString() });
    const call = repo.create.mock.calls[0][0];
    expect((call as any).delayMinutes).toBeGreaterThanOrEqual(4);
    expect((call as any).delayMinutes).toBeLessThanOrEqual(6);
  });
});

describe('ActivityRepositoryImpl.createWithPipelineSync', () => {
  const dealSeed = {
    clientId: baseInput.clientId,
    clientName: 'Cliente prueba',
    sellerId: baseInput.sellerId,
    stage: PipelineStage.Contactado,
    amount: 100,
    probability: 15,
    opportunityName: null,
  };

  it('locks, ensures one active deal and saves the activity in one transaction', async () => {
    const query = jest.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const save = jest.fn().mockResolvedValue({ id: 'activity-1' });
    const manager = {
      query,
      getRepository: jest.fn().mockReturnValue({
        create: jest.fn((value) => value),
        save,
      }),
    };
    const transaction = jest.fn(async (work) => work(manager));
    const repository = new ActivityRepositoryImpl({ manager: { transaction } } as any);

    await repository.createWithPipelineSync({ sellerId: baseInput.sellerId }, dealSeed);

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(String(query.mock.calls[0][0])).toContain('pg_advisory_xact_lock');
    expect(String(query.mock.calls[1][0])).toContain('"deleted_at" IS NULL');
    expect(String(query.mock.calls[2][0])).toContain('INSERT INTO "deals"');
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('does not insert a duplicate deal after the transactional lock finds coverage', async () => {
    const query = jest.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'deal-existing' }]);
    const manager = {
      query,
      getRepository: jest.fn().mockReturnValue({
        create: jest.fn((value) => value),
        save: jest.fn().mockResolvedValue({ id: 'activity-2' }),
      }),
    };
    const repository = new ActivityRepositoryImpl({
      manager: { transaction: jest.fn(async (work) => work(manager)) },
    } as any);

    await repository.createWithPipelineSync({ sellerId: baseInput.sellerId }, dealSeed);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO "deals"'))).toBe(false);
  });

  it('propagates activity persistence failure from the transaction', async () => {
    const failure = new Error('activity write failed');
    const manager = {
      query: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'deal-existing' }]),
      getRepository: jest.fn().mockReturnValue({
        create: jest.fn((value) => value),
        save: jest.fn().mockRejectedValue(failure),
      }),
    };
    const repository = new ActivityRepositoryImpl({
      manager: { transaction: jest.fn(async (work) => work(manager)) },
    } as any);

    await expect(
      repository.createWithPipelineSync({ sellerId: baseInput.sellerId }, dealSeed),
    ).rejects.toThrow('activity write failed');
  });
});

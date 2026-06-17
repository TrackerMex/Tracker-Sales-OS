import { BadRequestException } from '@nestjs/common';
import { CreateActivityUseCase } from './create-activity.use-case';
import { ActivityType, ActivityResult } from '../../domain/entities/activity.entity';
import { IActivityRepository } from '../../domain/repositories/activity.repository.interface';
import { IDealsRepository } from '../../../pipeline/domain/repositories/deal.repository.interface';

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

  beforeEach(() => {
    repo = makeMockRepo();
    dealRepo = makeMockDealRepo();
    useCase = new CreateActivityUseCase(repo as any, dealRepo as any);
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

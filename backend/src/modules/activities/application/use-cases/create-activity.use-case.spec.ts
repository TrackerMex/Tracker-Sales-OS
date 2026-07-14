import { BadRequestException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { CreateActivityDto } from '../dtos/create-activity.dto';
import { CreateActivityUseCase } from './create-activity.use-case';
import {
  ActivityEntity,
  ActivityResult,
  ActivityType,
} from '../../domain/entities/activity.entity';
import { IActivityRepository } from '../../domain/repositories/activity.repository.interface';
import { ActivityTypeormEntity } from '../../infrastructure/entities/activity.typeorm.entity';
import { ActivityRepositoryImpl } from '../../infrastructure/repositories/activity.repository.impl';
import {
  ClientEntity,
  ClientSource,
  ClientType,
  PersonType,
  PipelineStage,
} from '../../../clients/domain/entities/client.entity';
import { IClientRepository } from '../../../clients/domain/repositories/client.repository.interface';
import { DealEntity } from '../../../pipeline/domain/entities/deal.entity';
import { IDealsRepository } from '../../../pipeline/domain/repositories/deal.repository.interface';

type MockedMethods<T> = {
  [Key in keyof T]: T[Key] extends (...args: never[]) => unknown
    ? jest.MockedFunction<T[Key]>
    : never;
};

const baseInput: Omit<CreateActivityDto, 'type'> = {
  sellerId: '00000000-0000-0000-0000-000000000001',
  clientId: '00000000-0000-0000-0000-000000000002',
  result: ActivityResult.Interesado,
  summary: 'test',
  executedAt: '2025-01-01T12:00:00.000Z',
};

const makeActivity = (
  overrides: Partial<ActivityEntity> = {},
): ActivityEntity =>
  Object.assign(new ActivityEntity(), {
    id: 'activity-1',
    sellerId: baseInput.sellerId,
    clientId: baseInput.clientId ?? null,
    contactId: null,
    taskId: null,
    type: ActivityType.Chat,
    result: ActivityResult.Interesado,
    summary: baseInput.summary,
    discovery: null,
    agreement: null,
    nextStep: null,
    nextObjective: null,
    nextDate: null,
    nextTime: null,
    points: 1,
    quality: 0,
    stage: PipelineStage.Contactado,
    status: 'Pendiente',
    activityHistory: [],
    executedAt: new Date(baseInput.executedAt),
    programmedAt: null,
    capturedAt: new Date(baseInput.executedAt),
    delayMinutes: 0,
    createdAt: new Date(baseInput.executedAt),
    updatedAt: new Date(baseInput.executedAt),
    deletedAt: null,
    ...overrides,
  });

const makeDeal = (overrides: Partial<DealEntity> = {}): DealEntity =>
  Object.assign(new DealEntity(), {
    id: 'existing-deal',
    clientId: baseInput.clientId,
    clientName: 'Cliente prueba',
    sellerId: baseInput.sellerId,
    stage: PipelineStage.Contactado,
    amount: 1250,
    probability: 15,
    stageHistory: [],
    opportunityName: null,
    createdAt: new Date(baseInput.executedAt),
    updatedAt: new Date(baseInput.executedAt),
    deletedAt: null,
    ...overrides,
  });

const makeClient = (overrides: Partial<ClientEntity> = {}): ClientEntity =>
  Object.assign(new ClientEntity(), {
    id: baseInput.clientId,
    name: 'Cliente prueba',
    domain: null,
    type: ClientType.Nuevo,
    person: PersonType.Moral,
    sellerId: baseInput.sellerId,
    source: ClientSource.ProspeccionPropia,
    stage: PipelineStage.Contactado,
    expectedAmount: 1250,
    units: 1,
    pain: null,
    provider: null,
    nextStep: null,
    nextDate: null,
    nextTime: null,
    contacts: [],
    createdAt: new Date(baseInput.executedAt),
    updatedAt: new Date(baseInput.executedAt),
    deletedAt: null,
    ...overrides,
  });

const makeMockRepo = (): MockedMethods<IActivityRepository> => ({
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
  createAndTouchDeal: jest.fn(),
});

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

describe('CreateActivityUseCase', () => {
  let useCase: CreateActivityUseCase;
  let repo: MockedMethods<IActivityRepository>;
  let dealRepo: MockedMethods<IDealsRepository>;
  let clientRepo: MockedMethods<IClientRepository>;

  beforeEach(() => {
    repo = makeMockRepo();
    repo.create.mockImplementation((activity) =>
      Promise.resolve(makeActivity(activity)),
    );
    repo.createWithPipelineSync.mockImplementation((activity) =>
      Promise.resolve(makeActivity({ ...activity, id: 'activity-atomic' })),
    );
    repo.createAndTouchDeal.mockImplementation((activity) =>
      Promise.resolve(makeActivity({ ...activity, id: 'activity-touched' })),
    );
    dealRepo = makeMockDealRepo();
    dealRepo.findByClientIdAndSellerId.mockResolvedValue(makeDeal());
    clientRepo = makeMockClientRepo();
    clientRepo.findById.mockResolvedValue(makeClient());
    useCase = new CreateActivityUseCase(repo, dealRepo, clientRepo);
  });

  it('creates one deal from the persisted client stage when the first activity has no stage', async () => {
    dealRepo.findByClientIdAndSellerId.mockResolvedValue(null);

    await useCase.execute({ ...baseInput, type: ActivityType.Chat });

    expect(repo.createWithPipelineSync).toHaveBeenCalledTimes(1);
    expect(repo.createWithPipelineSync).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        clientId: baseInput.clientId,
        sellerId: baseInput.sellerId,
        clientName: 'Cliente prueba',
        stage: PipelineStage.Contactado,
        amount: 1250,
      }),
    );
    expect(repo.createWithPipelineSync).toHaveBeenCalledWith(
      expect.objectContaining({ stage: PipelineStage.Contactado }),
      expect.any(Object),
    );
  });

  it('prefers the activity stage over the persisted client stage', async () => {
    dealRepo.findByClientIdAndSellerId.mockResolvedValue(null);

    await useCase.execute({
      ...baseInput,
      type: ActivityType.Chat,
      stage: PipelineStage.Interesado,
    });

    expect(repo.createWithPipelineSync).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ stage: PipelineStage.Interesado }),
    );
  });

  it('does not create a deal when the client cannot be resolved', async () => {
    dealRepo.findByClientIdAndSellerId.mockResolvedValue(null);
    clientRepo.findById.mockResolvedValue(null);

    await useCase.execute({ ...baseInput, type: ActivityType.Chat });

    expect(repo.createWithPipelineSync).not.toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate a deal for a later activity or retry', async () => {
    dealRepo.findByClientIdAndSellerId.mockResolvedValue(
      makeDeal({ id: 'deal-1' }),
    );

    await useCase.execute({ ...baseInput, type: ActivityType.Chat });

    expect(repo.createWithPipelineSync).not.toHaveBeenCalled();
    expect(repo.createAndTouchDeal).toHaveBeenCalledWith(
      expect.any(Object),
      'deal-1',
    );
    expect(clientRepo.findById).not.toHaveBeenCalled();
  });

  it('does not create a deal when the activity has no clientId', async () => {
    await useCase.execute({
      sellerId: baseInput.sellerId,
      type: ActivityType.Prospeccion,
      result: ActivityResult.Interesado,
      summary: 'Prospeccion sin cliente',
      executedAt: baseInput.executedAt,
    });

    expect(repo.createWithPipelineSync).not.toHaveBeenCalled();
    expect(repo.createAndTouchDeal).not.toHaveBeenCalled();
    expect(clientRepo.findById).not.toHaveBeenCalled();
  });

  it('does not create a deal under a seller different from the client owner', async () => {
    dealRepo.findByClientIdAndSellerId.mockResolvedValue(null);
    clientRepo.findById.mockResolvedValue(
      makeClient({ sellerId: '00000000-0000-0000-0000-000000000099' }),
    );

    await useCase.execute({ ...baseInput, type: ActivityType.Chat });

    expect(repo.createWithPipelineSync).not.toHaveBeenCalled();
  });

  it('assigns correct points for Chat (1)', async () => {
    await useCase.execute({ ...baseInput, type: ActivityType.Chat });

    expect(repo.createAndTouchDeal).toHaveBeenCalledWith(
      expect.objectContaining({ points: 1 }),
      'existing-deal',
    );
  });

  it('assigns correct points for Llamada (3)', async () => {
    await useCase.execute({
      ...baseInput,
      type: ActivityType.Llamada,
      nextStep: 'call back',
      nextDate: '2025-01-01',
      nextTime: '10:00',
    });

    expect(repo.createAndTouchDeal).toHaveBeenCalledWith(
      expect.objectContaining({ points: 3 }),
      'existing-deal',
    );
  });

  it('assigns correct points for Cierre (25)', async () => {
    await useCase.execute({ ...baseInput, type: ActivityType.Cierre });

    expect(repo.createAndTouchDeal).toHaveBeenCalledWith(
      expect.objectContaining({ points: 25 }),
      'existing-deal',
    );
  });

  it('calculates quality=0 when all fields are empty/short', async () => {
    await useCase.execute({
      ...baseInput,
      type: ActivityType.Chat,
      summary: 'short',
    });

    expect(repo.createAndTouchDeal).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 0 }),
      'existing-deal',
    );
  });

  it('calculates quality=100 when all 5 conditions are met', async () => {
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

    expect(repo.createAndTouchDeal).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 100 }),
      'existing-deal',
    );
  });

  it('calculates quality=40 when only summary(>20) + nextDate + nextTime present', async () => {
    await useCase.execute({
      ...baseInput,
      type: ActivityType.Chat,
      summary: 'a'.repeat(21),
      nextDate: '2025-01-01',
      nextTime: '10:00',
    });

    expect(repo.createAndTouchDeal).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 40 }),
      'existing-deal',
    );
  });

  it('throws BadRequestException if type=Llamada and nextStep is missing', async () => {
    await expect(
      useCase.execute({ ...baseInput, type: ActivityType.Llamada }),
    ).rejects.toThrow(BadRequestException);
  });

  it('calculates delayMinutes as positive difference', async () => {
    const pastDate = new Date(Date.now() - 5 * 60 * 1000);

    await useCase.execute({
      ...baseInput,
      type: ActivityType.Chat,
      executedAt: pastDate.toISOString(),
    });

    const activity = repo.createAndTouchDeal.mock.calls[0]?.[0];
    expect(activity?.delayMinutes).toBeGreaterThanOrEqual(4);
    expect(activity?.delayMinutes).toBeLessThanOrEqual(6);
  });

  it('touches only the deal resolved by opportunity name', async () => {
    dealRepo.findByOpportunity.mockResolvedValue(
      makeDeal({ id: 'opportunity-deal', stage: PipelineStage.Propuesta }),
    );

    await useCase.execute({
      ...baseInput,
      type: ActivityType.Chat,
      opportunityName: 'Renovación anual',
    });

    expect(dealRepo.findByOpportunity).toHaveBeenCalledWith(
      baseInput.clientId,
      baseInput.sellerId,
      'Renovación anual',
    );
    expect(repo.createAndTouchDeal).toHaveBeenCalledWith(
      expect.objectContaining({ stage: PipelineStage.Propuesta }),
      'opportunity-deal',
    );
  });
});

interface PersistenceState {
  queryCalls: { sql: string; parameters?: unknown[] }[];
  saveCalls: number;
  transactionCalls: number;
}

const makeTypeormActivity = (
  overrides: Partial<ActivityTypeormEntity> = {},
): ActivityTypeormEntity =>
  Object.assign(new ActivityTypeormEntity(), {
    ...makeActivity(),
    version: 1,
    ...overrides,
  });

const makePersistenceHarness = (
  queryResults: unknown[][],
  saveFailure?: Error,
): { repository: ActivityRepositoryImpl; state: PersistenceState } => {
  const state: PersistenceState = {
    queryCalls: [],
    saveCalls: 0,
    transactionCalls: 0,
  };
  const pendingResults = [...queryResults];
  const activityRepo = {
    create: (value: Partial<ActivityTypeormEntity>): ActivityTypeormEntity =>
      makeTypeormActivity(value),
    save: (value: ActivityTypeormEntity): Promise<ActivityTypeormEntity> => {
      state.saveCalls += 1;
      return saveFailure ? Promise.reject(saveFailure) : Promise.resolve(value);
    },
  };
  const manager = {
    query: (sql: string, parameters?: unknown[]): Promise<unknown[]> => {
      state.queryCalls.push({ sql, parameters });
      return Promise.resolve(pendingResults.shift() ?? []);
    },
    getRepository: () => activityRepo,
  } as unknown as EntityManager;
  const transaction = <T>(
    work: (transactionManager: EntityManager) => Promise<T>,
  ): Promise<T> => {
    state.transactionCalls += 1;
    return work(manager);
  };
  const typeormRepo = {
    manager: { transaction },
  } as unknown as Repository<ActivityTypeormEntity>;

  return {
    repository: new ActivityRepositoryImpl(typeormRepo),
    state,
  };
};

describe('ActivityRepositoryImpl.createAndTouchDeal', () => {
  it('saves the activity and touches only updated_at in one transaction', async () => {
    const { repository, state } = makePersistenceHarness([[{ id: 'deal-1' }]]);

    await repository.createAndTouchDeal(
      { sellerId: baseInput.sellerId },
      'deal-1',
    );

    expect(state.transactionCalls).toBe(1);
    expect(state.saveCalls).toBe(1);
    const call = state.queryCalls[0];
    expect(call?.sql).toContain('SET "updated_at" = NOW()');
    expect(call?.sql).not.toContain('created_at');
    expect(call?.sql).not.toContain('stage_history');
    expect(call?.parameters).toEqual(['deal-1']);
  });

  it('throws when the resolved deal cannot be touched so the transaction rolls back', async () => {
    const { repository } = makePersistenceHarness([[]]);

    await expect(
      repository.createAndTouchDeal(
        { sellerId: baseInput.sellerId },
        'missing-deal',
      ),
    ).rejects.toThrow('Deal missing-deal not found');
  });
});

describe('ActivityRepositoryImpl.createWithPipelineSync', () => {
  const dealSeed = {
    clientId: baseInput.clientId ?? '',
    clientName: 'Cliente prueba',
    sellerId: baseInput.sellerId,
    stage: PipelineStage.Contactado,
    amount: 100,
    probability: 15,
    opportunityName: null,
  };

  it('locks, ensures one active deal and saves the activity in one transaction', async () => {
    const { repository, state } = makePersistenceHarness([[], [], []]);

    await repository.createWithPipelineSync(
      { sellerId: baseInput.sellerId },
      dealSeed,
    );

    expect(state.transactionCalls).toBe(1);
    expect(state.queryCalls[0]?.sql).toContain('pg_advisory_xact_lock');
    expect(state.queryCalls[1]?.sql).toContain('"deleted_at" IS NULL');
    expect(state.queryCalls[2]?.sql).toContain('INSERT INTO "deals"');
    expect(state.saveCalls).toBe(1);
  });

  it('does not insert a duplicate deal after the transactional lock finds coverage', async () => {
    const { repository, state } = makePersistenceHarness([
      [],
      [{ id: 'deal-existing' }],
    ]);

    await repository.createWithPipelineSync(
      { sellerId: baseInput.sellerId },
      dealSeed,
    );

    expect(state.queryCalls).toHaveLength(2);
    expect(
      state.queryCalls.some(({ sql }) => sql.includes('INSERT INTO "deals"')),
    ).toBe(false);
  });

  it('propagates activity persistence failure from the transaction', async () => {
    const failure = new Error('activity write failed');
    const { repository } = makePersistenceHarness(
      [[], [{ id: 'deal-existing' }]],
      failure,
    );

    await expect(
      repository.createWithPipelineSync(
        { sellerId: baseInput.sellerId },
        dealSeed,
      ),
    ).rejects.toThrow('activity write failed');
  });
});

import { Repository } from 'typeorm';
import { ActivityTypeormEntity } from '../../../activities/infrastructure/entities/activity.typeorm.entity';
import { TaskTypeormEntity } from '../../../tasks/infrastructure/entities/task.typeorm.entity';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import { GetSellersScoreUseCase } from './get-sellers-score.use-case';

interface ScoreScenario {
  pointsToday?: number;
  qualityToday?: number;
  monthlyPoints?: number;
  overdueCount?: number;
}

const makeUseCase = (scenario: ScoreScenario = {}): GetSellersScoreUseCase => {
  const activities =
    scenario.pointsToday === undefined && scenario.qualityToday === undefined
      ? []
      : [
          {
            points: scenario.pointsToday ?? 0,
            quality: scenario.qualityToday ?? 0,
          } as ActivityTypeormEntity,
        ];
  const overdueTasks = Array.from(
    { length: scenario.overdueCount ?? 0 },
    () => ({}) as TaskTypeormEntity,
  );
  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({
      total: String(scenario.monthlyPoints ?? 0),
    }),
  };
  const activityRepo = {
    find: jest.fn().mockResolvedValue(activities),
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
  } as unknown as Repository<ActivityTypeormEntity>;
  const taskRepo = {
    find: jest.fn().mockResolvedValue(overdueTasks),
  } as unknown as Repository<TaskTypeormEntity>;
  const sellerRepo = {
    find: jest
      .fn()
      .mockResolvedValue([
        { id: 'seller-1', name: 'Seller One', active: true },
      ]),
  } as unknown as Repository<SellerTypeormEntity>;

  return new GetSellersScoreUseCase(activityRepo, taskRepo, sellerRepo);
};

describe('GetSellersScoreUseCase', () => {
  it.each([
    [44, 'rojo', { qualityToday: 100, monthlyPoints: 11.25 }],
    [45, 'ambar', { pointsToday: 30 }],
    [75, 'verde', { pointsToday: 30, monthlyPoints: 37.5 }],
  ] as const)(
    'classifies score %s as %s at semaphore boundaries',
    async (expectedScore, expectedSemaphore, scenario) => {
      const [result] = await makeUseCase(scenario).execute();

      expect(result).toMatchObject({
        score: expectedScore,
        semaphore: expectedSemaphore,
      });
    },
  );

  it('returns zero/red when the seller has no activity', async () => {
    const [result] = await makeUseCase().execute();

    expect(result).toMatchObject({
      score: 0,
      semaphore: 'rojo',
      pointsToday: 0,
      avgQualityToday: 0,
      monthlyPoints: 0,
    });
  });

  it('clamps a score above the maximum to 100', async () => {
    const [result] = await makeUseCase({
      pointsToday: 60,
      qualityToday: 100,
      monthlyPoints: 100,
    }).execute();

    expect(result.score).toBe(100);
    expect(result.semaphore).toBe('verde');
  });

  it('subtracts ten points per overdue task and clamps below zero', async () => {
    const [penalized] = await makeUseCase({
      pointsToday: 30,
      qualityToday: 100,
      monthlyPoints: 25,
      overdueCount: 1,
    }).execute();
    const [clamped] = await makeUseCase({ overdueCount: 2 }).execute();

    expect(penalized).toMatchObject({ score: 90, overdueCount: 1 });
    expect(clamped).toMatchObject({
      score: 0,
      semaphore: 'rojo',
      overdueCount: 2,
    });
  });
});

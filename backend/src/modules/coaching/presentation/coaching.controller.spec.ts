import { ForbiddenException } from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { ActivityTypeormEntity } from '../../activities/infrastructure/entities/activity.typeorm.entity';
import { TaskTypeormEntity } from '../../tasks/infrastructure/entities/task.typeorm.entity';
import { SellerTypeormEntity } from '../../sellers/infrastructure/entities/seller.typeorm.entity';
import { SettingTypeormEntity } from '../../settings/infrastructure/entities/setting.typeorm.entity';
import { GetSettingsUseCase } from '../../settings/application/use-cases/get-settings.use-case';
import { IDealsRepository } from '../../pipeline/domain/repositories/deal.repository.interface';
import { GetCoachingDailyUseCase } from '../application/use-cases/get-coaching-daily.use-case';
import { GenerateSuggestionUseCase } from '../application/use-cases/generate-suggestion.use-case';
import { CoachingController } from './coaching.controller';

const setup = () => {
  const query = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ avgQ: '0' }),
  };
  const repository = {
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn().mockReturnValue(query),
  };
  const activityRepo =
    repository as unknown as Repository<ActivityTypeormEntity>;
  const settings = new GetSettingsUseCase(
    {} as Repository<SettingTypeormEntity>,
  );
  const deals = {
    findByClientIdAndSellerId: jest.fn().mockResolvedValue(null),
  } as unknown as IDealsRepository;
  const suggestion = new GenerateSuggestionUseCase(
    { complete: () => Promise.resolve('["Consejo local"]') },
    activityRepo,
    deals,
    settings,
  );
  const daily = new GetCoachingDailyUseCase(
    activityRepo,
    {} as Repository<TaskTypeormEntity>,
    {} as Repository<SellerTypeormEntity>,
    settings,
  );
  return { controller: new CoachingController(daily, suggestion), repository };
};

describe('CoachingController suggestion identity', () => {
  it.each([UserRole.Seller, UserRole.Admin, UserRole.Director])(
    'uses the correct context owner for %s',
    async (role) => {
      const { controller, repository } = setup();
      await controller.getSuggestion(
        { type: 'Chat', clientId: 'client-1', sellerId: 'body-owner' },
        { user: { role, sellerId: 'jwt-owner' } },
      );
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            clientId: 'client-1',
            sellerId: role === UserRole.Seller ? 'jwt-owner' : 'body-owner',
            deletedAt: IsNull(),
          },
        }),
      );
    },
  );

  it('rejects a Seller without JWT identity before loading context', () => {
    const { controller, repository } = setup();
    expect(() =>
      controller.getSuggestion(
        { type: 'Chat', sellerId: 'body-owner' },
        { user: { role: UserRole.Seller, sellerId: null } },
      ),
    ).toThrow(ForbiddenException);
    expect(repository.find).not.toHaveBeenCalled();
    expect(repository.createQueryBuilder).not.toHaveBeenCalled();
  });
});

import { IsNull, Repository } from 'typeorm';
import { ActivityTypeormEntity } from '../../../activities/infrastructure/entities/activity.typeorm.entity';
import { IDealsRepository } from '../../../pipeline/domain/repositories/deal.repository.interface';
import { GetSettingsUseCase } from '../../../settings/application/use-cases/get-settings.use-case';
import { SettingTypeormEntity } from '../../../settings/infrastructure/entities/setting.typeorm.entity';
import { GenerateSuggestionUseCase } from './generate-suggestion.use-case';

describe('GenerateSuggestionUseCase owner context', () => {
  it.each(['selected-owner', undefined])(
    'filters recent activities for owner %s and excludes deleted records',
    async (sellerId) => {
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
      const deals = {
        findByClientIdAndSellerId: jest.fn().mockResolvedValue(null),
      };
      const settings = new GetSettingsUseCase(
        {} as Repository<SettingTypeormEntity>,
      );
      const useCase = new GenerateSuggestionUseCase(
        { complete: () => Promise.resolve('["Consejo local"]') },
        repository as unknown as Repository<ActivityTypeormEntity>,
        deals as unknown as IDealsRepository,
        settings,
      );

      await useCase.execute({ type: 'Chat', clientId: 'client-1', sellerId });

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          clientId: 'client-1',
          ...(sellerId ? { sellerId } : {}),
          deletedAt: IsNull(),
        },
        order: { executedAt: 'DESC' },
        take: 3,
      });
      if (sellerId)
        expect(query.where).toHaveBeenCalledWith('a.sellerId = :sellerId', {
          sellerId,
        });
      else expect(repository.createQueryBuilder).not.toHaveBeenCalled();
    },
  );
});

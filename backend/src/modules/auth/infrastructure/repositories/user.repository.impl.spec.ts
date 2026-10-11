import { IsNull, Repository } from 'typeorm';
import { UserTypeormEntity } from '../entities/user.typeorm.entity';
import { UserRepositoryImpl } from './user.repository.impl';

describe('UserRepositoryImpl.setActiveBySellerId', () => {
  it.each([false, true])(
    'sets active=%s only for non-deleted accounts belonging to the selected seller',
    async (active) => {
      const update = jest.fn().mockResolvedValue({ affected: 2 });
      const repository = new UserRepositoryImpl({
        update,
      } as unknown as Repository<UserTypeormEntity>);

      await repository.setActiveBySellerId('seller-1', active);

      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith(
        { sellerId: 'seller-1', deletedAt: IsNull() },
        { active },
      );
    },
  );
});

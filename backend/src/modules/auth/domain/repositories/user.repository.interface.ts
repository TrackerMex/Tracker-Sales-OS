import { IRepository } from '../../../../core/domain/repository.interface';
import { UserEntity } from '../entities/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository extends IRepository<UserEntity> {
  findByUsername(username: string): Promise<UserEntity | null>;
}

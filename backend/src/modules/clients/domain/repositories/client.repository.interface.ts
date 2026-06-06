import { IRepository } from '../../../../core/domain/repository.interface';
import { ClientEntity } from '../entities/client.entity';

export const CLIENT_REPOSITORY = 'CLIENT_REPOSITORY';

export interface DuplicateCheckParams {
  name?: string;
  domain?: string;
  phone?: string;
  email?: string;
  excludeId?: string;
}

export interface IClientRepository extends IRepository<ClientEntity> {
  findBySellerId(sellerId: string): Promise<ClientEntity[]>;
  checkDuplicates(params: DuplicateCheckParams): Promise<ClientEntity | null>;
}

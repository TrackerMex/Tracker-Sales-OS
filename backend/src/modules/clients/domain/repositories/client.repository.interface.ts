import { IRepository } from '../../../../core/domain/repository.interface';
import { ClientEntity, ClientType, PipelineStage } from '../entities/client.entity';

export const CLIENT_REPOSITORY = 'CLIENT_REPOSITORY';

export interface DuplicateCheckParams {
  name?: string;
  domain?: string;
  phone?: string;
  email?: string;
  excludeId?: string;
}

export interface ClientFilters {
  stage?: PipelineStage;
  type?: ClientType;
  sellerId?: string;
  q?: string;
  page?: number;
  limit?: number;
  coldBefore?: Date;
  incomplete?: boolean;
}

export interface IClientRepository extends IRepository<ClientEntity> {
  findBySellerId(sellerId: string): Promise<ClientEntity[]>;
  findWithFilters(filters: ClientFilters): Promise<{ data: ClientEntity[]; total: number }>;
  checkDuplicates(params: DuplicateCheckParams): Promise<ClientEntity | null>;
  addContact(clientId: string, contact: Partial<ClientEntity['contacts'][number]>): Promise<ClientEntity>;
}

import { IRepository } from '../../../../core/domain/repository.interface';
import { SellerEntity } from '../entities/seller.entity';

export const SELLER_REPOSITORY = 'SELLER_REPOSITORY';

export interface ISellerRepository extends IRepository<SellerEntity> {
  findAllActive(): Promise<SellerEntity[]>;
}

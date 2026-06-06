import { BaseEntity } from '../../../../core/domain/base.entity';

export class SellerEntity extends BaseEntity {
  name: string;
  profile: string | null;
  userId: string | null;
  active: boolean;
}

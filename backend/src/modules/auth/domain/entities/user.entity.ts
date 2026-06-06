import { BaseEntity } from '../../../../core/domain/base.entity';

export enum UserRole {
  Admin = 'Admin',
  Director = 'Director',
  Seller = 'Seller',
}

export class UserEntity extends BaseEntity {
  username: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  sellerId: string | null;
  active: boolean;
}

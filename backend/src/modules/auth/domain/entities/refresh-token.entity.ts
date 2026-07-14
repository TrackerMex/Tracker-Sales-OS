import { BaseEntity } from '../../../../core/domain/base.entity';

export class RefreshTokenEntity extends BaseEntity {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

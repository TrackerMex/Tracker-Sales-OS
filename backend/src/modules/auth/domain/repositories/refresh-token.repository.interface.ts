import { IRepository } from '../../../../core/domain/repository.interface';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';

export interface IRefreshTokenRepository extends IRepository<RefreshTokenEntity> {
  /**
   * Revoca (marca revokedAt = now) todas las filas activas (revokedAt IS NULL)
   * de un usuario. Usado en la detección de reuso de refresh token (posible robo).
   */
  revokeAllActiveForUser(userId: string): Promise<void>;
}

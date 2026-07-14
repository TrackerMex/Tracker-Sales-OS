import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { LogoutDto } from '../dtos/logout.dto';

interface RefreshJwtPayload {
  sub: string;
  userId: string;
}

@Injectable()
export class LogoutUseCase implements IUseCase<LogoutDto, void> {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: LogoutDto): Promise<void> {
    // Best-effort: el logout local siempre debe poder completarse en el
    // frontend, así que cualquier fallo aquí (firma inválida, token
    // expirado, fila inexistente) se ignora y responde 200 igual.
    try {
      const refreshSecret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'changeme-refresh',
      );
      const payload = this.jwtService.verify<RefreshJwtPayload>(
        dto.refreshToken,
        { secret: refreshSecret },
      );

      const row = await this.refreshTokenRepo.findById(payload.sub);
      if (row && row.revokedAt === null) {
        await this.refreshTokenRepo.update(row.id, { revokedAt: new Date() });
      }
    } catch {
      // no-op: ver comentario arriba
    }
  }
}

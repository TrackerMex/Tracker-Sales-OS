import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshDto, RefreshResponseDto } from '../dtos/refresh.dto';

interface RefreshJwtPayload {
  sub: string;
  userId: string;
}

@Injectable()
export class RefreshTokenUseCase implements IUseCase<
  RefreshDto,
  RefreshResponseDto
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: RefreshDto): Promise<RefreshResponseDto> {
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'changeme-refresh',
    );
    const refreshExpiresIn = this.configService.get<
      NonNullable<JwtSignOptions['expiresIn']>
    >('JWT_REFRESH_EXPIRES_IN', '7d');

    let payload: RefreshJwtPayload;
    try {
      payload = this.jwtService.verify<RefreshJwtPayload>(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const row = await this.refreshTokenRepo.findById(payload.sub);
    if (!row) throw new UnauthorizedException('Refresh token inválido');

    if (row.revokedAt !== null) {
      // El refresh recibido ya fue rotado antes: posible robo/reuso.
      // Revoca TODAS las sesiones activas del usuario, no solo esta.
      await this.refreshTokenRepo.revokeAllActiveForUser(row.userId);
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (row.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const matches = await bcrypt.compare(dto.refreshToken, row.tokenHash);
    if (!matches) throw new UnauthorizedException('Refresh token inválido');

    const user = await this.userRepo.findById(row.userId);
    if (!user || !user.active)
      throw new UnauthorizedException('Refresh token inválido');

    // Rotación: revoca la fila actual y emite una nueva.
    await this.refreshTokenRepo.update(row.id, { revokedAt: new Date() });

    const newRow = await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: '',
      expiresAt: new Date(),
      revokedAt: null,
    });

    const newRefreshToken = this.jwtService.sign(
      { sub: newRow.id, userId: user.id },
      { secret: refreshSecret, expiresIn: refreshExpiresIn },
    );
    const decoded = this.jwtService.decode<{ exp: number }>(newRefreshToken);
    const tokenHash = await bcrypt.hash(newRefreshToken, 10);

    await this.refreshTokenRepo.update(newRow.id, {
      tokenHash,
      expiresAt: new Date(decoded.exp * 1000),
    });

    const accessToken = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
      sellerId: user.sellerId,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}

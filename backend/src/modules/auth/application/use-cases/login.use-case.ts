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
import { LoginDto, LoginResponseDto } from '../dtos/login.dto';

@Injectable()
export class LoginUseCase implements IUseCase<LoginDto, LoginResponseDto> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userRepo.findByUsername(dto.username);
    if (!user || !user.active)
      throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      sellerId: user.sellerId,
    };
    const accessToken = this.jwtService.sign(payload);

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'changeme-refresh',
    );
    const refreshExpiresIn = this.configService.get<
      NonNullable<JwtSignOptions['expiresIn']>
    >('JWT_REFRESH_EXPIRES_IN', '7d');

    const row = await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: '',
      expiresAt: new Date(),
      revokedAt: null,
    });

    const refreshToken = this.jwtService.sign(
      { sub: row.id, userId: user.id },
      { secret: refreshSecret, expiresIn: refreshExpiresIn },
    );
    const decoded = this.jwtService.decode<{ exp: number }>(refreshToken);
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await this.refreshTokenRepo.update(row.id, {
      tokenHash,
      expiresAt: new Date(decoded.exp * 1000),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        sellerId: user.sellerId,
      },
    };
  }
}

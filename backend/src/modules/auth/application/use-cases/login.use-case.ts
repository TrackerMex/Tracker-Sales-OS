import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { LoginDto, LoginResponseDto } from '../dtos/login.dto';

@Injectable()
export class LoginUseCase implements IUseCase<LoginDto, LoginResponseDto> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userRepo.findByUsername(dto.username);
    if (!user || !user.active) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const payload = { sub: user.id, username: user.username, role: user.role, sellerId: user.sellerId };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: { id: user.id, username: user.username, name: user.name, role: user.role, sellerId: user.sellerId },
    };
  }
}

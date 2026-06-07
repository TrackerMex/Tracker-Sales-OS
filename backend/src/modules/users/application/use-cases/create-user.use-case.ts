import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { USER_REPOSITORY, IUserRepository } from '../../../auth/domain/repositories/user.repository.interface';
import { CreateUserDto, UserDto } from '../dtos/user.dto';
import { UserEntity } from '../../../auth/domain/entities/user.entity';

@Injectable()
export class CreateUserUseCase implements IUseCase<CreateUserDto, UserDto> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserDto> {
    const existing = await this.userRepo.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException(`Username '${dto.username}' is already taken`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepo.create({
      username: dto.username,
      passwordHash,
      name: dto.name,
      role: dto.role,
      sellerId: dto.sellerId ?? null,
      active: true,
    });

    return this.toDto(user);
  }

  private toDto(user: UserEntity): UserDto {
    const { passwordHash, ...rest } = user;
    return rest as UserDto;
  }
}

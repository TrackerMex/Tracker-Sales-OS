import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import {
  USER_REPOSITORY,
  IUserRepository,
} from '../../../auth/domain/repositories/user.repository.interface';

import { UserEntity } from '../../../auth/domain/entities/user.entity';
import { UserDto } from '../dtos/user.dto';

@Injectable()
export class BlockUserUseCase implements IUseCase<string, UserDto> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(id: string): Promise<UserDto> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const active = !user.active;
    const updated = await this.userRepo.update(id, { active });

    return this.toDto(updated);
  }

  private toDto(user: UserEntity): UserDto {
    const { passwordHash, ...rest } = user;
    return rest as UserDto;
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { USER_REPOSITORY, IUserRepository } from '../../../auth/domain/repositories/user.repository.interface';
import { GetUsersQueryDto, UserDto } from '../dtos/user.dto';
import { UserEntity } from '../../../auth/domain/entities/user.entity';

@Injectable()
export class GetUsersUseCase implements IUseCase<GetUsersQueryDto, { data: UserDto[]; total: number }> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(query: GetUsersQueryDto): Promise<{ data: UserDto[]; total: number }> {
    const { data, total } = await this.userRepo.findAll({
      page: query.page,
      limit: query.limit,
    });
    return { data: data.map((u) => this.toDto(u)), total };
  }

  private toDto(user: UserEntity): UserDto {
    const { passwordHash, ...rest } = user;
    return rest as UserDto;
  }
}

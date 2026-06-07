import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './presentation/users.controller';
import { GetUsersUseCase } from './application/use-cases/get-users.use-case';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { BlockUserUseCase } from './application/use-cases/block-user.use-case';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [GetUsersUseCase, CreateUserUseCase, BlockUserUseCase],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './presentation/auth.controller';
import { UserTypeormEntity } from './infrastructure/entities/user.typeorm.entity';
import { UserRepositoryImpl } from './infrastructure/repositories/user.repository.impl';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([UserTypeormEntity])],
  controllers: [AuthController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryImpl,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class AuthModule {}

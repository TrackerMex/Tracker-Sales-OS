import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './presentation/auth.controller';
import { UserTypeormEntity } from './infrastructure/entities/user.typeorm.entity';
import { UserRepositoryImpl } from './infrastructure/repositories/user.repository.impl';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { SeedUseCase } from './application/use-cases/seed.use-case';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from './infrastructure/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTypeormEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'changeme'),
        signOptions: { expiresIn: (config.get<string>('JWT_EXPIRES_IN', '7d')) as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserRepositoryImpl },
    LoginUseCase,
    SeedUseCase,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [USER_REPOSITORY, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}

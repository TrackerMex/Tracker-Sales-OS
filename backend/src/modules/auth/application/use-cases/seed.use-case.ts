import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { UserRole } from '../../domain/entities/user.entity';

@Injectable()
export class SeedUseCase implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedUseCase.name);

  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

  async onApplicationBootstrap() {
    const { total } = await this.userRepo.findAll();
    if (total > 0) return;

    const passwordHash = await bcrypt.hash('Admin123!', 10);
    await this.userRepo.create({
      username: 'admin',
      passwordHash,
      name: 'Administrador',
      role: UserRole.Admin,
      sellerId: null,
      active: true,
    });
    this.logger.log('Seed: usuario admin creado (password: Admin123!)');
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { ActivityTypeormEntity } from '../activities/infrastructure/entities/activity.typeorm.entity';
import { CLIENT_REPOSITORY } from './domain/repositories/client.repository.interface';
import { AddContactUseCase } from './application/use-cases/add-contact.use-case';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case';
import { DeleteClientUseCase } from './application/use-cases/delete-client.use-case';
import { GetClientsUseCase } from './application/use-cases/get-clients.use-case';
import { UpdateClientUseCase } from './application/use-cases/update-client.use-case';
import { ClientTypeormEntity } from './infrastructure/entities/client.typeorm.entity';
import { ContactTypeormEntity } from './infrastructure/entities/contact.typeorm.entity';
import { ClientRepositoryImpl } from './infrastructure/repositories/client.repository.impl';
import { ClientsController } from './presentation/clients.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientTypeormEntity, ContactTypeormEntity, ActivityTypeormEntity]),
    AuthModule,
    SettingsModule,
  ],
  controllers: [ClientsController],
  providers: [
    { provide: CLIENT_REPOSITORY, useClass: ClientRepositoryImpl },
    GetClientsUseCase,
    CreateClientUseCase,
    UpdateClientUseCase,
    AddContactUseCase,
    DeleteClientUseCase,
  ],
  exports: [CLIENT_REPOSITORY],
})
export class ClientsModule {}

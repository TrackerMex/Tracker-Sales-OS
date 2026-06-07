import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CLIENT_REPOSITORY } from './domain/repositories/client.repository.interface';
import { AddContactUseCase } from './application/use-cases/add-contact.use-case';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case';
import { GetClientsUseCase } from './application/use-cases/get-clients.use-case';
import { UpdateClientUseCase } from './application/use-cases/update-client.use-case';
import { ClientTypeormEntity } from './infrastructure/entities/client.typeorm.entity';
import { ContactTypeormEntity } from './infrastructure/entities/contact.typeorm.entity';
import { ClientRepositoryImpl } from './infrastructure/repositories/client.repository.impl';
import { ClientsController } from './presentation/clients.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientTypeormEntity, ContactTypeormEntity]), AuthModule],
  controllers: [ClientsController],
  providers: [
    { provide: CLIENT_REPOSITORY, useClass: ClientRepositoryImpl },
    GetClientsUseCase,
    CreateClientUseCase,
    UpdateClientUseCase,
    AddContactUseCase,
  ],
  exports: [CLIENT_REPOSITORY],
})
export class ClientsModule {}

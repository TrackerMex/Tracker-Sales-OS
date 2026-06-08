import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { UserRole } from '../../../auth/domain/entities/user.entity';
import {
  CLIENT_REPOSITORY,
  IClientRepository,
} from '../../domain/repositories/client.repository.interface';
import { RequestUserDto } from '../dtos/client.dto';

export interface DeleteClientInput {
  id: string;
  user: RequestUserDto;
}

@Injectable()
export class DeleteClientUseCase implements IUseCase<DeleteClientInput, void> {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepo: IClientRepository,
  ) {}

  async execute(input: DeleteClientInput): Promise<void> {
    const client = await this.clientRepo.findById(input.id);
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (
      input.user.role === UserRole.Seller &&
      client.sellerId !== input.user.sellerId
    ) {
      throw new ForbiddenException('No tienes acceso a este cliente');
    }

    await this.clientRepo.softDelete(input.id);
  }
}

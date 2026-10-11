import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../../auth/domain/entities/user.entity';
import { ClientEntity } from '../../domain/entities/client.entity';
import { IClientRepository } from '../../domain/repositories/client.repository.interface';
import { GetClientUseCase } from './get-client.use-case';

describe('GetClientUseCase', () => {
  const client = Object.assign(new ClientEntity(), {
    id: 'client-outside-first-page',
    sellerId: 'seller-owner',
    name: 'Cliente del expediente',
    contacts: [{ id: 'contact-1', name: 'Contacto del expediente' }],
    pain: 'Necesidad persistida',
    provider: 'Proveedor persistido',
    deletedAt: null,
  });
  let findById: jest.Mock;
  let useCase: GetClientUseCase;

  beforeEach(() => {
    findById = jest.fn().mockResolvedValue(client);
    useCase = new GetClientUseCase({
      findById,
    } as unknown as IClientRepository);
  });

  it.each([UserRole.Admin, UserRole.Director, UserRole.Seller])(
    'returns the exact client and contacts by id for %s',
    async (role) => {
      const result = await useCase.execute({
        id: client.id,
        user: { id: 'user-1', role, sellerId: client.sellerId },
      });

      expect(findById).toHaveBeenCalledWith(client.id);
      expect(result).toBe(client);
      expect(result.contacts).toEqual(client.contacts);
      expect(result).not.toHaveProperty('isCold');
      expect(result).not.toHaveProperty('dataQuality');
      expect(result).not.toHaveProperty('lastActivityAt');
    },
  );

  it('rejects another owner for Seller', async () => {
    await expect(
      useCase.execute({
        id: client.id,
        user: { id: 'user-1', role: UserRole.Seller, sellerId: 'other-owner' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects Seller without an identity before querying clients', async () => {
    await expect(
      useCase.execute({
        id: client.id,
        user: { id: 'user-1', role: UserRole.Seller, sellerId: null },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(findById).not.toHaveBeenCalled();
  });

  it.each([null, { ...client, deletedAt: new Date() }])(
    'returns 404 for a missing or deleted client',
    async (storedClient) => {
      findById.mockResolvedValue(storedClient);
      await expect(
        useCase.execute({
          id: client.id,
          user: { id: 'user-1', role: UserRole.Admin, sellerId: null },
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );
});

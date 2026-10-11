import { NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../../auth/domain/repositories/user.repository.interface';
import { SellerEntity } from '../../domain/entities/seller.entity';
import { ISellerRepository } from '../../domain/repositories/seller.repository.interface';
import { DeactivateSellerUseCase } from './deactivate-seller.use-case';

describe('DeactivateSellerUseCase', () => {
  it.each([
    { active: true, linkedSellerId: null },
    { active: false, linkedSellerId: null },
    { active: true, linkedSellerId: 'seller-1' },
    { active: false, linkedSellerId: 'seller-1' },
  ])(
    'synchronizes a legacy account with active=$active and sellerId=$linkedSellerId',
    async ({ active, linkedSellerId }) => {
      const seller = Object.assign(new SellerEntity(), {
        id: 'seller-1',
        name: 'Vendedor',
        active,
        userId: 'user-1',
        deletedAt: null,
      });
      const updateSeller = jest.fn().mockResolvedValue({
        ...seller,
        active: !active,
      });
      const updateUser = jest.fn().mockResolvedValue({ active: !active });
      const setActiveBySellerId = jest.fn().mockResolvedValue(undefined);
      const useCase = new DeactivateSellerUseCase(
        {
          findById: jest.fn().mockResolvedValue(seller),
          update: updateSeller,
        } as unknown as ISellerRepository,
        {
          findById: jest.fn().mockResolvedValue({
            id: seller.userId,
            sellerId: linkedSellerId,
            deletedAt: null,
          }),
          update: updateUser,
          setActiveBySellerId,
        } as unknown as IUserRepository,
      );

      const result = await useCase.execute(seller.id);

      expect(updateSeller).toHaveBeenCalledWith(seller.id, { active: !active });
      expect(setActiveBySellerId).toHaveBeenCalledWith(seller.id, !active);
      expect(updateUser).toHaveBeenCalledWith(seller.userId, {
        active: !active,
      });
      expect(result.active).toBe(!active);
    },
  );

  it.each([
    null,
    { id: 'user-1', sellerId: 'seller-1', deletedAt: new Date() },
    { id: 'user-1', sellerId: 'other-seller', deletedAt: null },
  ])(
    'does not change a missing, deleted or foreign legacy account',
    async (user) => {
      const seller = Object.assign(new SellerEntity(), {
        id: 'seller-1',
        active: true,
        userId: 'user-1',
        deletedAt: null,
      });
      const updateUser = jest.fn();
      const setActiveBySellerId = jest.fn().mockResolvedValue(undefined);
      const useCase = new DeactivateSellerUseCase(
        {
          findById: jest.fn().mockResolvedValue(seller),
          update: jest.fn().mockResolvedValue({ ...seller, active: false }),
        } as unknown as ISellerRepository,
        {
          findById: jest.fn().mockResolvedValue(user),
          update: updateUser,
          setActiveBySellerId,
        } as unknown as IUserRepository,
      );

      expect((await useCase.execute(seller.id)).active).toBe(false);
      expect(setActiveBySellerId).toHaveBeenCalledWith(seller.id, false);
      expect(updateUser).not.toHaveBeenCalled();
    },
  );

  it.each([true, false])(
    'synchronizes accounts by sellerId when the inverse userId is null, active=%s',
    async (active) => {
      const seller = Object.assign(new SellerEntity(), {
        id: 'seller-1',
        active,
        userId: null,
        deletedAt: null,
      });
      const updateUser = jest.fn();
      const setActiveBySellerId = jest.fn().mockResolvedValue(undefined);
      const useCase = new DeactivateSellerUseCase(
        {
          findById: jest.fn().mockResolvedValue(seller),
          update: jest.fn().mockResolvedValue({ ...seller, active: !active }),
        } as unknown as ISellerRepository,
        {
          update: updateUser,
          setActiveBySellerId,
        } as unknown as IUserRepository,
      );

      expect((await useCase.execute(seller.id)).active).toBe(!active);
      expect(setActiveBySellerId).toHaveBeenCalledWith(seller.id, !active);
      expect(updateUser).not.toHaveBeenCalled();
    },
  );

  it.each([null, { id: 'seller-1', deletedAt: new Date() }])(
    'rejects missing or deleted sellers without writes',
    async (seller) => {
      const updateSeller = jest.fn();
      const updateUser = jest.fn();
      const setActiveBySellerId = jest.fn();
      const useCase = new DeactivateSellerUseCase(
        {
          findById: jest.fn().mockResolvedValue(seller),
          update: updateSeller,
        } as unknown as ISellerRepository,
        {
          update: updateUser,
          setActiveBySellerId,
        } as unknown as IUserRepository,
      );

      await expect(useCase.execute('seller-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(updateSeller).not.toHaveBeenCalled();
      expect(updateUser).not.toHaveBeenCalled();
      expect(setActiveBySellerId).not.toHaveBeenCalled();
    },
  );
});

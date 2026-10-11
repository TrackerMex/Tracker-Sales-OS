import { SellerEntity } from '../../domain/entities/seller.entity';
import { ISellerRepository } from '../../domain/repositories/seller.repository.interface';
import { GetSellersUseCase } from './get-sellers.use-case';

describe('GetSellersUseCase', () => {
  const activeSeller = Object.assign(new SellerEntity(), {
    id: 'active-seller',
    name: 'Activo',
    active: true,
  });
  const inactiveSeller = Object.assign(new SellerEntity(), {
    id: 'inactive-seller',
    name: 'Inactivo',
    active: false,
  });
  let findAllActive: jest.Mock;
  let findAllIncludingInactive: jest.Mock;
  let useCase: GetSellersUseCase;

  beforeEach(() => {
    findAllActive = jest.fn().mockResolvedValue([activeSeller]);
    findAllIncludingInactive = jest
      .fn()
      .mockResolvedValue([activeSeller, inactiveSeller]);
    useCase = new GetSellersUseCase({
      findAllActive,
      findAllIncludingInactive,
    } as unknown as ISellerRepository);
  });

  it.each([undefined, { includeInactive: false }])(
    'keeps the active-only default for input %s',
    async (input) => {
      const result = await useCase.execute(input);
      expect(result.map((seller) => seller.id)).toEqual([activeSeller.id]);
      expect(findAllActive).toHaveBeenCalledTimes(1);
      expect(findAllIncludingInactive).not.toHaveBeenCalled();
    },
  );

  it('includes inactive sellers only in the requested management scope', async () => {
    const result = await useCase.execute({ includeInactive: true });
    expect(
      result.map((seller) => ({ id: seller.id, active: seller.active })),
    ).toEqual([
      { id: activeSeller.id, active: true },
      { id: inactiveSeller.id, active: false },
    ]);
    expect(findAllIncludingInactive).toHaveBeenCalledTimes(1);
    expect(findAllActive).not.toHaveBeenCalled();
  });
});

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import {
  SELLER_REPOSITORY,
  ISellerRepository,
} from '../../domain/repositories/seller.repository.interface';
import {
  USER_REPOSITORY,
  IUserRepository,
} from '../../../auth/domain/repositories/user.repository.interface';
import { SellerDto } from '../dtos/seller.dto';
import { SellerEntity } from '../../domain/entities/seller.entity';

@Injectable()
export class DeactivateSellerUseCase implements IUseCase<string, SellerDto> {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellerRepo: ISellerRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(id: string): Promise<SellerDto> {
    const seller = await this.sellerRepo.findById(id);
    if (!seller) {
      throw new NotFoundException(`Seller with id ${id} not found`);
    }

    const updated = await this.sellerRepo.update(id, { active: false });

    if (seller.userId) {
      await this.userRepo.update(seller.userId, { active: false });
    }

    return this.toDto(updated);
  }

  private toDto(seller: SellerEntity): SellerDto {
    const dto = new SellerDto();
    dto.id = seller.id;
    dto.name = seller.name;
    dto.profile = seller.profile;
    dto.userId = seller.userId;
    dto.active = seller.active;
    dto.createdAt = seller.createdAt;
    return dto;
  }
}

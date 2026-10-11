import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import {
  SELLER_REPOSITORY,
  ISellerRepository,
} from '../../domain/repositories/seller.repository.interface';
import { SellerDto } from '../dtos/seller.dto';
import { SellerEntity } from '../../domain/entities/seller.entity';

export interface GetSellersInput {
  includeInactive?: boolean;
}

@Injectable()
export class GetSellersUseCase implements IUseCase<
  GetSellersInput | undefined,
  SellerDto[]
> {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellerRepo: ISellerRepository,
  ) {}

  async execute(input?: GetSellersInput): Promise<SellerDto[]> {
    const sellers = input?.includeInactive
      ? await this.sellerRepo.findAllIncludingInactive()
      : await this.sellerRepo.findAllActive();
    return sellers.map((s) => this.toDto(s));
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

import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import {
  SELLER_REPOSITORY,
  ISellerRepository,
} from '../../domain/repositories/seller.repository.interface';
import { CreateSellerDto, SellerDto } from '../dtos/seller.dto';
import { SellerEntity } from '../../domain/entities/seller.entity';

@Injectable()
export class CreateSellerUseCase implements IUseCase<
  CreateSellerDto,
  SellerDto
> {
  constructor(
    @Inject(SELLER_REPOSITORY)
    private readonly sellerRepo: ISellerRepository,
  ) {}

  async execute(dto: CreateSellerDto): Promise<SellerDto> {
    const seller = await this.sellerRepo.create({
      name: dto.name,
      profile: dto.profile ?? null,
      userId: dto.userId ?? null,
      active: true,
    });
    return this.toDto(seller);
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

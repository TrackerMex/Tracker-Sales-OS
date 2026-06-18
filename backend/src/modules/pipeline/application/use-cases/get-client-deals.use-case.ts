import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { DEAL_REPOSITORY, IDealsRepository } from '../../domain/repositories/deal.repository.interface';
import { DealDto } from '../dtos/deal.dto';

interface GetClientDealsInput {
  clientId: string;
  sellerId: string;
}

@Injectable()
export class GetClientDealsUseCase implements IUseCase<GetClientDealsInput, DealDto[]> {
  constructor(
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepo: IDealsRepository,
  ) {}

  async execute(input: GetClientDealsInput): Promise<DealDto[]> {
    const deals = await this.dealRepo.findAllByClientAndSeller(input.clientId, input.sellerId);
    return deals.map((d) => DealDto.fromEntity(d));
  }
}

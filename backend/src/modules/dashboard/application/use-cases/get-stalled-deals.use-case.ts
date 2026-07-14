import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { StalledDealsResponseDto } from '../dtos/stalled-deal.dto';
import { IDealsRepository } from '../../../pipeline/domain/repositories/deal.repository.interface';
import { GetSettingsUseCase } from '../../../settings/application/use-cases/get-settings.use-case';
import { StalledDealsQueryDto } from '../dtos/stalled-deals-query.dto';

@Injectable()
export class GetStalledDealsUseCase implements IUseCase<
  StalledDealsQueryDto,
  StalledDealsResponseDto
> {
  constructor(
    @Inject('DEAL_REPOSITORY')
    private readonly dealRepo: IDealsRepository,
    private readonly getSettings: GetSettingsUseCase,
  ) {}

  async execute(input: StalledDealsQueryDto): Promise<StalledDealsResponseDto> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const settings = await this.getSettings.execute();
    const stalled = await this.dealRepo.findStalledDeals(
      settings.stalledAmberDays,
      page,
      limit,
    );

    return {
      data: stalled.data.map(
        ({ deal, daysStalled, clientName, sellerName }) => ({
          dealId: deal.id,
          clientName,
          sellerName,
          stage: deal.stage,
          amount: deal.amount,
          daysStalled,
          severity: daysStalled >= settings.stalledRedDays ? 'red' : 'amber',
        }),
      ),
      total: stalled.total,
      page,
      limit,
      totalPages: Math.ceil(stalled.total / limit),
    };
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { StalledDealDto } from '../dtos/stalled-deal.dto';
import { IDealsRepository } from '../../../pipeline/domain/repositories/deal.repository.interface';
import { GetSettingsUseCase } from '../../../settings/application/use-cases/get-settings.use-case';

@Injectable()
export class GetStalledDealsUseCase implements IUseCase<void, StalledDealDto[]> {
  constructor(
    @Inject('DEAL_REPOSITORY')
    private readonly dealRepo: IDealsRepository,
    private readonly getSettings: GetSettingsUseCase,
  ) {}

  async execute(): Promise<StalledDealDto[]> {
    const settings = await this.getSettings.execute();
    const stalled = await this.dealRepo.findStalledDeals(settings.stalledAmberDays);

    return stalled.map(({ deal, daysStalled }) => ({
      dealId: deal.id as string,
      clientName: deal.clientName ?? '',
      sellerName: '',
      stage: deal.stage,
      amount: deal.amount,
      daysStalled,
      severity: daysStalled >= settings.stalledRedDays ? 'red' : 'amber',
    }));
  }
}

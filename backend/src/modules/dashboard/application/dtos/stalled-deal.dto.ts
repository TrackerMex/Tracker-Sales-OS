export class StalledDealDto {
  dealId: string;
  clientName: string;
  sellerName: string;
  stage: string;
  amount: number;
  daysStalled: number;
  severity: 'amber' | 'red';
}

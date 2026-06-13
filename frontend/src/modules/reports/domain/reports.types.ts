export interface SellerSalesReport {
  sellerId: string;
  sellerName: string;
  amount: number;
  units: number;
  count: number;
}

export interface TypeReport {
  amount: number;
  units: number;
  count: number;
  newUnits: number;
  existingUnits: number;
  newAmount: number;
  existingAmount: number;
}

export interface SourceBreakdown {
  source: string;
  count: number;
  amount: number;
  units: number;
}

export interface MonthlyReport {
  month: string;
  monthlyAmountGoal: number;
  monthlyUnitGoal: number;
  direction: TypeReport;
  atc: TypeReport;
  team: TypeReport;
  total: TypeReport;
  sellers: SellerSalesReport[];
  bySource: SourceBreakdown[];
  commercialHealth: number;
}

export interface FunnelStage {
  stage: string;
  reached: number;
  conversionFromPrevious: number;
  avgDaysInStage: number;
}

export interface LossByOrigin {
  originStage: string;
  count: number;
  percentage: number;
}

export interface LossReasonRow {
  reason: string;
  count: number;
}

export interface WinLossReport {
  totalDeals: number;
  won: number;
  lost: number;
  open: number;
  winRate: number;
  funnel: FunnelStage[];
  lossesByOrigin: LossByOrigin[];
  lossReasons: LossReasonRow[];
}

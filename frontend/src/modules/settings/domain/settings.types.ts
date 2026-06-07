export interface AppSettings {
  dailyMinPoints: number;
  monthlyAmountGoal: number;
  monthlyUnitGoal: number;
  sellerMonthlyAmountGoal: number;
}

export interface UpdateSettingsInput {
  dailyMinPoints?: number;
  monthlyAmountGoal?: number;
  monthlyUnitGoal?: number;
  sellerMonthlyAmountGoal?: number;
}

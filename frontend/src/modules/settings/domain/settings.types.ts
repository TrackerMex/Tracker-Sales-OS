export interface AppSettings {
  dailyMinPoints: number;
  dailyCallsGoal: number;
  monthlyAmountGoal: number;
  monthlyUnitGoal: number;
  sellerMonthlyAmountGoal: number;
}

export interface UpdateSettingsInput {
  dailyMinPoints?: number;
  dailyCallsGoal?: number;
  monthlyAmountGoal?: number;
  monthlyUnitGoal?: number;
  sellerMonthlyAmountGoal?: number;
}

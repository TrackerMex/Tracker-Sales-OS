export interface AppSettings {
  dailyMinPoints: number;
  monthlyAmountGoal: number;
  monthlyUnitGoal: number;
  sellerMonthlyAmountGoal: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  dailyMinPoints: 30,
  monthlyAmountGoal: 600000,
  monthlyUnitGoal: 150,
  sellerMonthlyAmountGoal: 150000,
};

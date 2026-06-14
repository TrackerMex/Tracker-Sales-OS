export interface AppSettings {
  dailyMinPoints: number;
  dailyCallsGoal: number;
  monthlyAmountGoal: number;
  monthlyUnitGoal: number;
  sellerMonthlyAmountGoal: number;
  stalledAmberDays: number;
  stalledRedDays: number;
  coldAccountDays: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  dailyMinPoints: 30,
  dailyCallsGoal: 10,
  monthlyAmountGoal: 600000,
  monthlyUnitGoal: 150,
  sellerMonthlyAmountGoal: 150000,
  stalledAmberDays: 7,
  stalledRedDays: 14,
  coldAccountDays: 14,
};

export class MiDiaDto {
  sellerId: string;
  sellerName: string;
  pointsToday: number;
  dailyPointsGoal: number;
  callsToday: number;
  dailyCallsGoal: number;
  tomorrowTasksCount: number;
  tomorrowTasksGoal: number;
  newProspectsToday: number;
  newProspectsGoal: number;
  overdueCount: number;
  coldAccountsCount: number;
  semaphore: 'verde' | 'ambar' | 'rojo' | 'morado';
  coachTips: string[];
}

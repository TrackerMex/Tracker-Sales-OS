export interface ActivityMixItem {
  type: string;
  count: number;
  percentage: number;
}

export class CoachingDailyDto {
  sellerId: string;
  sellerName: string;
  pointsToday: number;
  dailyPointsGoal: number;
  progressPct: number;
  avgQuality: number;
  activityMix: ActivityMixItem[];
  overdueCount: number;
  tomorrowTasksCount: number;
  totalActivitiesToday: number;
  mixInsights: string[];
}

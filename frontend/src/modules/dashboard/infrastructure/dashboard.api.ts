import { api } from '@/shared/lib/axios';
import type { DashboardSummary, SellerScore, OverdueTask, ActivityTrendItem, StalledDeal, LeaderboardEntry } from '../domain/dashboard.types';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },

  getSellersScore: async (): Promise<SellerScore[]> => {
    const res = await api.get<SellerScore[]>('/dashboard/sellers-score');
    return res.data;
  },

  getOverdueTasks: async (): Promise<OverdueTask[]> => {
    const res = await api.get<OverdueTask[]>('/dashboard/overdue-tasks');
    return res.data;
  },

  getActivityTrend: async (): Promise<ActivityTrendItem[]> => {
    const res = await api.get<ActivityTrendItem[]>('/dashboard/activity-trend');
    return res.data;
  },

  getStalledDeals: async (): Promise<StalledDeal[]> => {
    const res = await api.get<StalledDeal[]>('/dashboard/stalled-deals');
    return res.data;
  },

  getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const res = await api.get<LeaderboardEntry[]>('/dashboard/leaderboard');
    return res.data;
  },
};

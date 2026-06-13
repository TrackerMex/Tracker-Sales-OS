import { api } from '@/shared/lib/axios';
import type { MonthlyReport, WinLossReport } from '../domain/reports.types';

export const reportsApi = {
  getMonthly: async (month: string): Promise<MonthlyReport> => {
    const res = await api.get<MonthlyReport>('/reports/monthly', {
      params: { month },
    });
    return res.data;
  },
  getWinLoss: async (): Promise<WinLossReport> => {
    const res = await api.get<WinLossReport>('/reports/win-loss');
    return res.data;
  },
};

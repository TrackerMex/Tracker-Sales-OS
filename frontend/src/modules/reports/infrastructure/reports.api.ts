import { api } from '@/shared/lib/axios';
import type { MonthlyReport } from '../domain/reports.types';

export const reportsApi = {
  getMonthly: async (month: string): Promise<MonthlyReport> => {
    const res = await api.get<MonthlyReport>('/reports/monthly', {
      params: { month },
    });
    return res.data;
  },
};

export interface DashboardSummary {
  month: string;
  totalSalesAmount: number;
  totalUnits: number;
  totalPoints: number;
  avgQuality: number;
  totalSalesCount: number;
}

export interface SellerScore {
  sellerId: string;
  sellerName: string;
  score: number;
  semaphore: 'verde' | 'ambar' | 'rojo';
  pointsToday: number;
  avgQualityToday: number;
  monthlyPoints: number;
  overdueCount: number;
}

export interface OverdueTask {
  taskId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  scheduledAt: string;
  daysOverdue: number;
}

export class SellerScoreDto {
  sellerId: string;
  sellerName: string;
  score: number;
  semaphore: 'verde' | 'ambar' | 'rojo';
  pointsToday: number;
  avgQualityToday: number;
  monthlyPoints: number;
  overdueCount: number;
}

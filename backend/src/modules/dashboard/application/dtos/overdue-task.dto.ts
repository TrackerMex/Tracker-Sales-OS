export class OverdueTaskDto {
  taskId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  scheduledAt: Date;
  daysOverdue: number;
}

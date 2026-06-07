import { BaseEntity } from '../../../../core/domain/base.entity';

export enum TaskStatus {
  Pending = 'Pendiente',
  Completed = 'Completado',
}

export class TaskEntity extends BaseEntity {
  sellerId: string;
  clientId: string | null;
  title: string;
  description: string | null;
  scheduledAt: Date;
  completedAt: Date | null;
  status: TaskStatus;
}

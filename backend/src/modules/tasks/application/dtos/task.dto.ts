import { TaskEntity, TaskStatus } from '../../domain/entities/task.entity';

export class TaskDto {
  id: string;
  sellerId: string;
  clientId: string | null;
  title: string;
  description: string | null;
  scheduledAt: string;
  completedAt: string | null;
  status: TaskStatus;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;

  static fromEntity(entity: TaskEntity): TaskDto {
    const now = new Date();
    const dto = new TaskDto();
    dto.id = entity.id;
    dto.sellerId = entity.sellerId;
    dto.clientId = entity.clientId;
    dto.title = entity.title;
    dto.description = entity.description;
    dto.scheduledAt = entity.scheduledAt.toISOString();
    dto.completedAt = entity.completedAt?.toISOString() ?? null;
    dto.status = entity.status;
    dto.isOverdue =
      entity.status === TaskStatus.Pending && entity.scheduledAt < now;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

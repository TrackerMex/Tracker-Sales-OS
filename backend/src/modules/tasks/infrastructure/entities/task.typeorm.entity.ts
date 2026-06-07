import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { TaskStatus } from '../../domain/entities/task.entity';

@Entity('tasks')
export class TaskTypeormEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'seller_id' }) sellerId: string;

  @Column({ name: 'client_id', type: 'varchar', nullable: true }) clientId: string | null;

  @Column({ type: 'varchar', length: 200 }) title: string;

  @Column({ type: 'text', nullable: true }) description: string | null;

  @Column({ name: 'scheduled_at', type: 'timestamptz' }) scheduledAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.Pending })
  status: TaskStatus;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date | null;
}

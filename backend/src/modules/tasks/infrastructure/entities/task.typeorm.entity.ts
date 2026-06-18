import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { TaskStatus } from '../../domain/entities/task.entity';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import { ClientTypeormEntity } from '../../../clients/infrastructure/entities/client.typeorm.entity';

@Index('idx_tasks_seller_scheduled', ['sellerId', 'scheduledAt'])
@Index('idx_tasks_seller_id', ['sellerId'])
@Entity('tasks')
export class TaskTypeormEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'seller_id' }) sellerId: string;

  @ManyToOne(() => SellerTypeormEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller?: SellerTypeormEntity;

  @Column({ name: 'client_id', type: 'varchar', nullable: true }) clientId: string | null;

  @ManyToOne(() => ClientTypeormEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'client_id' })
  client?: ClientTypeormEntity;

  @Column({ type: 'varchar', length: 50, nullable: true }) type: string | null;

  @Column({ name: 'contact_id', type: 'varchar', nullable: true }) contactId: string | null;

  @Column({ type: 'text' }) title: string;

  @Column({ type: 'text', nullable: true }) description: string | null;

  @Column({ name: 'scheduled_at', type: 'timestamptz' }) scheduledAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.Pending })
  status: TaskStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' }) deletedAt: Date | null;
}

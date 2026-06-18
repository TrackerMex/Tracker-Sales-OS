import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index,
  JoinColumn, ManyToOne, VersionColumn,
} from 'typeorm';
import { ActivityType, ActivityResult, ActivityHistoryEntry } from '../../domain/entities/activity.entity';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import { ClientTypeormEntity } from '../../../clients/infrastructure/entities/client.typeorm.entity';

@Index('idx_activities_seller_executed', ['sellerId', 'executedAt'])
@Index('idx_activities_executed_at', ['executedAt'])
@Index('idx_activities_seller_id', ['sellerId'])
@Index('idx_activities_client_id', ['clientId'])
@Entity('activities')
export class ActivityTypeormEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'seller_id' }) sellerId: string;
  @ManyToOne(() => SellerTypeormEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller?: SellerTypeormEntity;
  @Column({ name: 'client_id', type: 'uuid', nullable: true }) clientId: string | null;
  @ManyToOne(() => ClientTypeormEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'client_id' })
  client?: ClientTypeormEntity;
  @Column({ name: 'contact_id', type: 'varchar', nullable: true }) contactId: string | null;
  @Column({ name: 'task_id', type: 'varchar', nullable: true }) taskId: string | null;
  @Column({ type: 'enum', enum: ActivityType }) type: ActivityType;
  @Column({ type: 'enum', enum: ActivityResult }) result: ActivityResult;
  @Column({ type: 'text' }) summary: string;
  @Column({ type: 'text', nullable: true }) discovery: string | null;
  @Column({ type: 'text', nullable: true }) agreement: string | null;
  @Column({ name: 'next_step', type: 'text', nullable: true }) nextStep: string | null;
  @Column({ name: 'next_objective', type: 'text', nullable: true }) nextObjective: string | null;
  @Column({ name: 'next_date', type: 'varchar', nullable: true }) nextDate: string | null;
  @Column({ name: 'next_time', type: 'varchar', nullable: true }) nextTime: string | null;
  @Column({ type: 'int' }) points: number;
  @Column({ type: 'int' }) quality: number;
  @Column({ type: 'varchar', nullable: true }) stage: string | null;
  @Column({ type: 'varchar', default: 'Pendiente' }) status: string;
  @Column({ name: 'activity_history', type: 'jsonb', default: [] }) activityHistory: ActivityHistoryEntry[];
  @Column({ name: 'executed_at', type: 'timestamptz' }) executedAt: Date;
  @Column({ name: 'programmed_at', type: 'timestamptz', nullable: true }) programmedAt: Date | null;
  @Column({ name: 'captured_at', type: 'timestamptz' }) capturedAt: Date;
  @Column({ name: 'delay_minutes', type: 'int' }) delayMinutes: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' }) deletedAt: Date | null;
  @VersionColumn({ default: 1 }) version: number;
}

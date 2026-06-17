import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { ActivityType, ActivityResult } from '../../domain/entities/activity.entity';

@Entity('activities')
export class ActivityTypeormEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'seller_id' }) sellerId: string;
  @Column({ name: 'client_id', type: 'varchar', nullable: true }) clientId: string | null;
  @Column({ name: 'contact_id', type: 'varchar', nullable: true }) contactId: string | null;
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
  @Column({ name: 'executed_at', type: 'timestamptz' }) executedAt: Date;
  @Column({ name: 'programmed_at', type: 'timestamptz', nullable: true }) programmedAt: Date | null;
  @Column({ name: 'captured_at', type: 'timestamptz' }) capturedAt: Date;
  @Column({ name: 'delay_minutes', type: 'int' }) delayMinutes: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date | null;
}

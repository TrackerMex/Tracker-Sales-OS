import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { StageHistoryEntry } from '../../domain/entities/deal.entity';

@Entity('deals')
export class DealTypeormEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'client_id', type: 'varchar' }) clientId: string;

  @Column({ name: 'seller_id', type: 'varchar' }) sellerId: string;

  @Column({ type: 'enum', enum: PipelineStage }) stage: PipelineStage;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'int', default: 5 }) probability: number;

  @Column({ name: 'stage_history', type: 'jsonb', default: [] })
  stageHistory: StageHistoryEntry[];

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date | null;
}

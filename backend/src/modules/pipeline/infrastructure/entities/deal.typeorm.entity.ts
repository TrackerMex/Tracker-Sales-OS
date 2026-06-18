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
  VersionColumn,
} from 'typeorm';
import { PipelineStage } from '../../../clients/domain/entities/client.entity';
import { StageHistoryEntry } from '../../domain/entities/deal.entity';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import { ClientTypeormEntity } from '../../../clients/infrastructure/entities/client.typeorm.entity';

@Index('idx_deals_seller_id', ['sellerId'])
@Index('idx_deals_client_seller', ['clientId', 'sellerId'])
@Index('idx_deals_stage', ['stage'])
@Index('idx_deals_client_id', ['clientId'])
@Entity('deals')
export class DealTypeormEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'client_id', type: 'uuid' }) clientId: string;

  @ManyToOne(() => ClientTypeormEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'client_id' })
  client?: ClientTypeormEntity;

  @Column({ name: 'client_name', type: 'varchar', nullable: true }) clientName: string;

  @Column({ name: 'seller_id', type: 'uuid' }) sellerId: string;

  @ManyToOne(() => SellerTypeormEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller?: SellerTypeormEntity;

  @Column({ type: 'enum', enum: PipelineStage }) stage: PipelineStage;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'int', default: 5 }) probability: number;

  @Column({ name: 'stage_history', type: 'jsonb', default: [] })
  stageHistory: StageHistoryEntry[];

  @Column({ name: 'opportunity_name', type: 'varchar', length: 200, nullable: true })
  opportunityName: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' }) deletedAt: Date | null;

  @VersionColumn({ default: 1 }) version: number;
}

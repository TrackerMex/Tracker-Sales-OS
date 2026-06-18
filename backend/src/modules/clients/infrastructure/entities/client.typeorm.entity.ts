import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import {
  ClientSource,
  ClientType,
  PersonType,
  PipelineStage,
} from '../../domain/entities/client.entity';
import { ContactTypeormEntity } from './contact.typeorm.entity';

@Index('idx_clients_seller_id', ['sellerId'])
@Index('idx_clients_seller_stage', ['sellerId', 'stage'])
@Entity('clients')
export class ClientTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  domain: string | null;

  @Column({ type: 'enum', enum: ClientType })
  type: ClientType;

  @Column({ type: 'enum', enum: PersonType })
  person: PersonType;

  @Column({ name: 'seller_id', type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => SellerTypeormEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller?: SellerTypeormEntity;

  @Column({ type: 'enum', enum: ClientSource })
  source: ClientSource;

  @Column({ type: 'enum', enum: PipelineStage, default: PipelineStage.Prospecto })
  stage: PipelineStage;

  @Column({ name: 'expected_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
  expectedAmount: number;

  @Column({ default: 0 })
  units: number;

  @Column({ nullable: true, type: 'text' })
  pain: string | null;

  @Column({ nullable: true, type: 'text' })
  provider: string | null;

  @Column({ name: 'next_step', nullable: true, type: 'text' })
  nextStep: string | null;

  @Column({ name: 'next_date', nullable: true, type: 'date' })
  nextDate: string | null;

  @Column({ name: 'next_time', nullable: true, type: 'time' })
  nextTime: string | null;

  @OneToMany(() => ContactTypeormEntity, (contact) => contact.client, {
    cascade: true,
  })
  contacts: ContactTypeormEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}

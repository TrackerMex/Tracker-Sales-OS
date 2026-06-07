import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ClientSource,
  ClientType,
  PersonType,
  PipelineStage,
} from '../../domain/entities/client.entity';
import { ContactTypeormEntity } from './contact.typeorm.entity';

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClientTypeormEntity } from './client.typeorm.entity';

@Index('idx_contacts_client_id', ['clientId'])
@Entity('contacts')
export class ContactTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => ClientTypeormEntity, (client) => client.contacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client: ClientTypeormEntity;

  @Column()
  name: string;

  @Column({ default: '' })
  role: string;

  @Column({ default: '' })
  phone: string;

  @Column({ default: '' })
  email: string;

  @Column({ name: 'is_decision_maker', default: false })
  isDecisionMaker: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Index('idx_audit_logs_entity', ['entityName', 'entityId'])
@Index('idx_audit_logs_user_id', ['userId'])
@Entity('audit_logs')
export class AuditLogTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ length: 50 })
  action: string;

  @Column({ name: 'entity_name', length: 100 })
  entityName: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: Record<string, unknown> | null;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

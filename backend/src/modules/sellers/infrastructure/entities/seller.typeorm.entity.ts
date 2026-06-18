import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sellers')
export class SellerTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  profile: string | null;

  @Column({ name: 'user_id', nullable: true, type: 'uuid' })
  userId: string | null;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' }) deletedAt: Date | null;
}

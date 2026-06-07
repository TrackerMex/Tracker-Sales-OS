import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class SettingTypeormEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', unique: true }) key: string;
  @Column({ type: 'jsonb' }) value: object;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}

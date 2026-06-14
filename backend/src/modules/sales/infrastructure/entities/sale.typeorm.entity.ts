import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { PaymentMethod, SaleSource, SaleType } from '../../domain/entities/sale.entity';

@Entity('sales')
export class SaleTypeormEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'seller_id', type: 'uuid' }) sellerId: string;

  @Column({ name: 'client_id', type: 'uuid', nullable: true }) clientId: string | null;

  @Column({ name: 'client_name', type: 'varchar' }) clientName: string;

  @Column({ name: 'client_type', type: 'varchar' }) clientType: 'Nuevo' | 'Existente';

  @Column({ type: 'varchar' }) product: string;

  @Column({ type: 'int' }) units: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 }) amount: number;

  @Column({ type: 'enum', enum: PaymentMethod }) pay: PaymentMethod;

  @Column({ type: 'enum', enum: SaleSource }) source: SaleSource;

  @Column({ type: 'enum', enum: SaleType }) type: SaleType;

  @Column({ type: 'date' }) date: Date;

  @Column({ type: 'text', nullable: true }) notes: string | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' }) deletedAt: Date | null;
}

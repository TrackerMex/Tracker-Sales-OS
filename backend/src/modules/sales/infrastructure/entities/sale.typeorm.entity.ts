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
} from 'typeorm';
import { PaymentMethod, SaleSource, SaleType } from '../../domain/entities/sale.entity';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import { ClientTypeormEntity } from '../../../clients/infrastructure/entities/client.typeorm.entity';

@Index('idx_sales_seller_id', ['sellerId'])
@Index('idx_sales_client_id', ['clientId'])
@Entity('sales')
export class SaleTypeormEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'seller_id', type: 'uuid' }) sellerId: string;

  @ManyToOne(() => SellerTypeormEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller?: SellerTypeormEntity;

  @Column({ name: 'client_id', type: 'uuid', nullable: true }) clientId: string | null;

  @ManyToOne(() => ClientTypeormEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'client_id' })
  client?: ClientTypeormEntity;

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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' }) deletedAt: Date | null;
}

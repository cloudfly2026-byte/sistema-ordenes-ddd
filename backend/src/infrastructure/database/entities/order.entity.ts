import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shopify_order_id', unique: true })
  shopifyOrderId: string;

  @Column({ type: 'enum', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'], default: 'PENDING' })
  status: string;

  @Column({ name: 'customer_email', nullable: true })
  customerEmail: string | null;

  @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalPrice: number;

  @Column({ name: 'currency', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'items_count', type: 'int', default: 0 })
  itemsCount: number;

  @Column({ name: 'has_fragile', default: false })
  hasFragileItems: boolean;

  @Column({ name: 'box_type', type: 'enum', enum: ['BOX_SMALL', 'BOX_MEDIUM', 'BOX_LARGE'], nullable: true })
  boxType: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'idempotency_key', nullable: true, unique: true })
  idempotencyKey: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;
}

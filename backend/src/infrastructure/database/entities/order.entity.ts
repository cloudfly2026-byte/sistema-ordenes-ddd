import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shopify_order_id', unique: true })
  shopifyOrderId: string;

  @Column({ length: 20 })
  status: string;

  @Column({ name: 'customer_email', nullable: true })
  customerEmail: string | null;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPrice: number;

  @Column({ name: 'has_fragile_items', default: false })
  hasFragileItems: boolean;

  @Column({ name: 'box_type', nullable: true })
  boxType: string | null;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'idempotency_key', nullable: true })
  idempotencyKey: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'processed_at', nullable: true })
  processedAt: Date | null;
}


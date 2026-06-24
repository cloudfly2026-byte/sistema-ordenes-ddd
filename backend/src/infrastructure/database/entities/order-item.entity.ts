import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('order_items')
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'shopify_line_item_id', nullable: true })
  shopifyLineItemId: string | null;

  @Column({ name: 'product_name', length: 512 })
  productName: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ name: 'is_fragile', default: false })
  isFragile: boolean;

  @Column({ length: 128, nullable: true })
  sku: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

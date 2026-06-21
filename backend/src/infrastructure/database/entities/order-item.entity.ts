import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'shopify_product_id' })
  shopifyProductId: string;

  @Column({ name: 'shopify_variant_id', nullable: true })
  shopifyVariantId: string | null;

  @Column({ length: 100 })
  sku: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'is_fragile', default: false })
  isFragile: boolean;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitPrice: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'material_id' })
  materialId: string;

  @Column({ name: 'order_id', nullable: true })
  orderId: string | null;

  @Column({ length: 20 })
  transactionType: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'stock_before', type: 'int' })
  stockBefore: number;

  @Column({ name: 'stock_after', type: 'int' })
  stockAfter: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


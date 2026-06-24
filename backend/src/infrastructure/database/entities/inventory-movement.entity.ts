import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inventory_id', type: 'uuid' })
  inventoryId: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ name: 'movement_type', type: 'enum', enum: ['RESERVE', 'CONSUME', 'RELEASE', 'ADJUSTMENT'] })
  movementType: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'quantity_before', type: 'int' })
  quantityBefore: number;

  @Column({ name: 'quantity_after', type: 'int' })
  quantityAfter: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', length: 128, default: 'system' })
  createdBy: string;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('order_materials')
export class OrderMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'material_id' })
  materialId: string;

  @Column({ name: 'quantity_required', type: 'int' })
  quantityRequired: number;

  @Column({ name: 'quantity_reserved', type: 'int', default: 0 })
  quantityReserved: number;

  @Column({ name: 'quantity_consumed', type: 'int', default: 0 })
  quantityConsumed: number;

  @Column({ type: 'enum', enum: ['PENDING', 'RESERVED', 'CONSUMED', 'RELEASED'], default: 'PENDING' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('order_materials')
export class OrderMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'material_id' })
  materialId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'material_type', length: 50 })
  materialType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


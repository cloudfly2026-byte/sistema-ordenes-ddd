import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  sku: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  type: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'current_stock', type: 'int', default: 0 })
  currentStock: number;

  @Column({ name: 'reserved_stock', type: 'int', default: 0 })
  reservedStock: number;

  @Column({ name: 'low_stock_threshold', type: 'int', default: 10 })
  lowStockThreshold: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, Unique } from 'typeorm';
import { MaterialEntity } from './material.entity';

@Entity('inventory')
@Unique(['materialId'])
export class InventoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'material_id', type: 'uuid' })
  materialId: string;

  @OneToOne('MaterialEntity', (material: MaterialEntity) => material.inventory)
  @JoinColumn({ name: 'material_id' })
  material?: MaterialEntity;

  @Column({ name: 'quantity_available', type: 'int', default: 0 })
  quantityAvailable: number;

  @Column({ name: 'quantity_reserved', type: 'int', default: 0 })
  quantityReserved: number;

  @Column({ name: 'minimum_stock', type: 'int', default: 10 })
  minimumStock: number;

  @Column({ name: 'last_updated_at', type: 'timestamptz', default: () => 'now()' })
  lastUpdatedAt: Date;

  @Column({ type: 'int', default: 1 })
  version: number;
}

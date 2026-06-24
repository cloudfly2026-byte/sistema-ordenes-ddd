import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { InventoryEntity } from './inventory.entity';

@Entity('materials')
export class MaterialEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'code', type: 'enum', enum: ['BOX_SMALL', 'BOX_MEDIUM', 'BOX_LARGE', 'LABEL', 'TAPE', 'FILLER'], unique: true })
  code: string;

  @Column({ length: 256 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 32, default: 'unit' })
  unit: string;

  @OneToOne('InventoryEntity', (inventory: InventoryEntity) => inventory.materialId, { cascade: true })
  @JoinColumn({ name: 'id' })
  inventory?: InventoryEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

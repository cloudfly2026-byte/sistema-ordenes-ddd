import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', nullable: true })
  orderId: string | null;

  @Column({ name: 'material_id', nullable: true })
  materialId: string | null;

  @Column({ length: 100 })
  action: string;

  @Column({ name: 'entity_type', length: 50 })
  entityType: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  @Column({ name: 'performed_by', length: 100, default: 'system' })
  performedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shopify_event_id', unique: true })
  shopifyEventId: string;

  @Column({ length: 128 })
  topic: string;

  @Column({ name: 'shop_domain', length: 256 })
  shopDomain: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ name: 'status', type: 'enum', enum: ['PENDING', 'PROCESSED', 'FAILED', 'DUPLICATE'], default: 'PENDING' })
  status: string;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @CreateDateColumn({ name: 'received_at' })
  receivedAt: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;
}

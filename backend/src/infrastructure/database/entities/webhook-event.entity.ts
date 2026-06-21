import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shopify_order_id' })
  shopifyOrderId: string;

  @Column({ name: 'webhook_topic', length: 50 })
  webhookTopic: string;

  @Column({ name: 'hmac_signature', length: 500 })
  hmacSignature: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ name: 'processing_status', length: 20, default: 'PENDING' })
  processingStatus: string;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'processed_at', nullable: true })
  processedAt: Date | null;
}


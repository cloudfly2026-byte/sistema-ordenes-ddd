import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('job_executions')
export class JobExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id' })
  jobId: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ length: 20 })
  status: string;

  @Column({ name: 'attempt', type: 'int', default: 1 })
  attempt: number;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


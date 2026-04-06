import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('sports_bet_queue')
export class SportsBetQueue {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @Index('idx_sports_queue_event_market')
  @Column({ name: 'event_id', type: 'varchar', length: 100 })
  eventId: string;

  @Column({ name: 'market_key', type: 'varchar', length: 50 })
  marketKey: string;

  @Column({ type: 'varchar', length: 100 })
  selection: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  stake: string;

  @Index('idx_sports_queue_status_exec')
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'execute_after', type: 'datetime' })
  executeAfter: Date;

  @Column({ name: 'last_attempt_at', type: 'datetime', nullable: true })
  lastAttemptAt: Date | null;

  @Column({ name: 'attempt_count', type: 'int', default: 0 })
  attemptCount: number;

  @Column({ name: 'max_attempts', type: 'int', default: 10 })
  maxAttempts: number;

  @Index('idx_sports_queue_idempotency')
  @Column({ name: 'idempotency_key', type: 'varchar', length: 180, nullable: true })
  idempotencyKey: string | null;

  @Column({ name: 'error_message', type: 'varchar', length: 255, nullable: true })
  errorMessage: string | null;

  @Column({ name: 'bet_no', type: 'varchar', length: 64, nullable: true })
  betNo: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

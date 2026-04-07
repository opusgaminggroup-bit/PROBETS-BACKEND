import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_orders')
export class PaymentOrder {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Index('idx_payment_order_no', { unique: true })
  @Column({ name: 'order_no', type: 'varchar', length: 64 })
  orderNo: string;

  @Column({ name: 'site_key', type: 'varchar', length: 50, default: 'default' })
  siteKey: string;

  @Column({ type: 'varchar', length: 20 })
  type: 'assign_credit' | 'deposit' | 'withdrawal';

  @Column({ type: 'varchar', length: 30 })
  provider: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true })
  userId: string | null;

  @Column({ name: 'target_user_id', type: 'bigint', unsigned: true, nullable: true })
  targetUserId: string | null;

  @Column({ name: 'operator_id', type: 'bigint', unsigned: true, nullable: true })
  operatorId: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 20, default: 'MYR' })
  currency: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  network: string | null;

  @Column({ name: 'wallet_address', type: 'varchar', length: 120, nullable: true })
  walletAddress: string | null;

  @Column({ name: 'channel_ref', type: 'varchar', length: 120, nullable: true })
  channelRef: string | null;

  @Column({ name: 'tx_hash', type: 'varchar', length: 150, nullable: true })
  txHash: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  remark: string | null;

  @Column({ name: 'meta_json', type: 'json', nullable: true })
  metaJson: unknown;

  @Column({ name: 'approved_at', type: 'datetime', nullable: true })
  approvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

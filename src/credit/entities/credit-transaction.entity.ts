import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreditTransactionType } from '../../common/enums/credit-transaction-type.enum';
import { User } from '../../users/entities/user.entity';

@Entity('credit_transactions')
export class CreditTransaction {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @ManyToOne(() => User, (u) => u.creditTransactions, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount: string;

  @Column({ type: 'enum', enum: CreditTransactionType })
  type: CreditTransactionType;

  @Column({ name: 'operator_id', type: 'bigint', unsigned: true })
  operatorId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @Column({ name: 'reference_id', type: 'varchar', length: 100, nullable: true })
  referenceId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  remark: string | null;

  @Column({ name: 'balance_before', type: 'decimal', precision: 20, scale: 2 })
  balanceBefore: string;

  @Column({ name: 'balance_after', type: 'decimal', precision: 20, scale: 2 })
  balanceAfter: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}

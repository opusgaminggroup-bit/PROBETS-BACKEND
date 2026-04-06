import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { CreditTransaction } from '../../credit/entities/credit-transaction.entity';
import { Bet } from '../../bets/entities/bet.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, default: Role.PLAYER })
  role: Role;

  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true })
  parentId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: User | null;

  @OneToMany(() => User, (u) => u.parent)
  children: User[];

  @Column({ name: 'credit_balance', type: 'decimal', precision: 20, scale: 2, default: 0 })
  creditBalance: string;

  @Column({ name: 'credit_limit', type: 'decimal', precision: 20, scale: 2, default: 0 })
  creditLimit: string;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: () => '1' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @OneToMany(() => CreditTransaction, (tx) => tx.user)
  creditTransactions: CreditTransaction[];

  @OneToMany(() => Bet, (bet) => bet.user)
  bets: Bet[];
}

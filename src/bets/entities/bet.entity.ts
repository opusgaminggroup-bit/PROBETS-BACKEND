import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BetType } from '../../common/enums/bet-type.enum';
import { BetResultStatus } from '../../common/enums/bet-result-status.enum';
import { User } from '../../users/entities/user.entity';

@Entity('bets')
export class Bet {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'bet_no', type: 'varchar', length: 64, unique: true })
  betNo: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @ManyToOne(() => User, (u) => u.bets, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'bet_type', type: 'enum', enum: BetType })
  betType: BetType;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount: string;

  @Column({ name: 'event_id', type: 'varchar', length: 100, nullable: true })
  eventId: string | null;

  @Column({ name: 'market_key', type: 'varchar', length: 50, nullable: true })
  marketKey: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  selection: string | null;

  @Column({ name: 'potential_payout', type: 'decimal', precision: 20, scale: 2, nullable: true })
  potentialPayout: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  odds: string | null;

  @Column({ name: 'result_status', type: 'enum', enum: BetResultStatus, default: BetResultStatus.PENDING })
  resultStatus: BetResultStatus;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  payout: string;

  @Column({ name: 'server_seed_hash', type: 'varchar', length: 64, nullable: true })
  serverSeedHash: string | null;

  @Column({ name: 'client_seed', type: 'varchar', length: 128, nullable: true })
  clientSeed: string | null;

  @Column({ type: 'int', nullable: true })
  nonce: number | null;

  @Column({ name: 'fair_roll', type: 'decimal', precision: 6, scale: 2, nullable: true })
  fairRoll: string | null;

  @Column({ name: 'fair_path_json', type: 'json', nullable: true })
  fairPathJson: unknown;

  @Column({ name: 'api_snapshot', type: 'json', nullable: true })
  apiSnapshot: unknown;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @Column({ name: 'settled_at', type: 'datetime', nullable: true })
  settledAt: Date | null;
}

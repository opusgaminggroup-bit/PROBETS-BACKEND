import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('bet_exposures')
@Unique('uq_bet_exposure_user_event_market', ['userId', 'eventId', 'marketKey'])
export class BetExposure {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Index('idx_bet_exposure_event_market')
  @Column({ name: 'event_id', type: 'varchar', length: 100 })
  eventId: string;

  @Column({ name: 'market_key', type: 'varchar', length: 50 })
  marketKey: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @Column({ name: 'total_stake', type: 'decimal', precision: 20, scale: 2, default: 0 })
  totalStake: string;

  @Column({ name: 'total_potential_payout', type: 'decimal', precision: 20, scale: 2, default: 0 })
  totalPotentialPayout: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

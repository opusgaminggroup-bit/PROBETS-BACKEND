import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('live_casino_sessions')
export class LiveCasinoSession {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Index('idx_live_session_session_id', { unique: true })
  @Column({ name: 'session_id', type: 'varchar', length: 100 })
  sessionId: string;

  @Column({ name: 'site_key', type: 'varchar', length: 50, default: 'default' })
  siteKey: string;

  @Column({ name: 'provider', type: 'varchar', length: 50 })
  provider: string;

  @Column({ name: 'game_id', type: 'varchar', length: 100 })
  gameId: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: string;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'active' })
  status: string;

  @Column({ name: 'launch_url', type: 'varchar', length: 500, nullable: true })
  launchUrl: string | null;

  @Column({ name: 'meta_json', type: 'json', nullable: true })
  metaJson: unknown;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

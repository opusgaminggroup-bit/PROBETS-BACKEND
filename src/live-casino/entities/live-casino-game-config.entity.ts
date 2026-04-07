import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('live_casino_game_configs')
export class LiveCasinoGameConfig {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'site_key', type: 'varchar', length: 50, default: 'default' })
  siteKey: string;

  @Index('idx_live_game_provider_game', { unique: true })
  @Column({ name: 'provider', type: 'varchar', length: 50 })
  provider: string;

  @Column({ name: 'game_id', type: 'varchar', length: 100 })
  gameId: string;

  @Column({ name: 'enabled', type: 'tinyint', width: 1, default: () => '1' })
  enabled: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

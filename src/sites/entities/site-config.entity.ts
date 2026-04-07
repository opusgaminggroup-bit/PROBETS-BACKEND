import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('site_configs')
export class SiteConfig {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Index('idx_site_key', { unique: true })
  @Column({ name: 'site_key', type: 'varchar', length: 50 })
  siteKey: string;

  @Column({ name: 'site_name', type: 'varchar', length: 100 })
  siteName: string;

  @Column({ name: 'domain', type: 'varchar', length: 120, nullable: true })
  domain: string | null;

  @Column({ name: 'currency', type: 'varchar', length: 20, default: 'MYR' })
  currency: string;

  @Column({ name: 'payment_provider', type: 'varchar', length: 30, default: 'manual' })
  paymentProvider: string;

  @Column({ name: 'live_casino_provider', type: 'varchar', length: 30, default: 'evolution' })
  liveCasinoProvider: string;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: () => '1' })
  isActive: boolean;

  @Column({ name: 'meta_json', type: 'json', nullable: true })
  metaJson: unknown;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

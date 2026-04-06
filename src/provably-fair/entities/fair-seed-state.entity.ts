import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('fair_seed_states')
export class FairSeedState {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true, unique: true })
  userId: string;

  @Column({ name: 'current_server_seed', type: 'varchar', length: 128 })
  currentServerSeed: string;

  @Column({ name: 'current_server_seed_hash', type: 'varchar', length: 64 })
  currentServerSeedHash: string;

  @Column({ type: 'int', default: 0 })
  nonce: number;

  @Column({ name: 'last_revealed_server_seed', type: 'varchar', length: 128, nullable: true })
  lastRevealedServerSeed: string | null;

  @Column({ name: 'last_revealed_server_seed_hash', type: 'varchar', length: 64, nullable: true })
  lastRevealedServerSeedHash: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

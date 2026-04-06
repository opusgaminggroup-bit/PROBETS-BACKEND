import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { EventStatus } from '../../common/enums/event-status.enum';

@Entity('events')
export class EventEntity {
  @PrimaryColumn({ name: 'event_id', type: 'varchar', length: 100 })
  eventId: string;

  @Column({ name: 'sport_key', type: 'varchar', length: 50 })
  sportKey: string;

  @Column({ name: 'home_team', type: 'varchar', length: 100 })
  homeTeam: string;

  @Column({ name: 'away_team', type: 'varchar', length: 100 })
  awayTeam: string;

  @Column({ name: 'commence_time', type: 'datetime', nullable: true })
  commenceTime: Date | null;

  @Column({ name: 'last_updated', type: 'datetime', nullable: true })
  lastUpdated: Date | null;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.UPCOMING })
  status: EventStatus;

  @Column({ name: 'bookmakers_json', type: 'json', nullable: true })
  bookmakersJson: unknown;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

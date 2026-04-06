import { EventStatus } from '../../common/enums/event-status.enum';
export declare class EventEntity {
    eventId: string;
    sportKey: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: Date | null;
    lastUpdated: Date | null;
    status: EventStatus;
    bookmakersJson: unknown;
    createdAt: Date;
    updatedAt: Date;
}

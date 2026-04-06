import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { EventEntity } from '../events/entities/event.entity';
export declare class OddsService {
    private readonly httpService;
    private readonly eventRepo;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(httpService: HttpService, eventRepo: Repository<EventEntity>);
    private ensureApiKey;
    getSports(): Promise<any>;
    getOdds(params: {
        sport: string;
        regions?: string;
        markets?: string;
        bookmakers?: string;
    }): Promise<any>;
    getScores(sport: string): Promise<any>;
    refreshSportOdds(params: {
        sport: string;
        regions?: string;
        markets?: string;
        bookmakers?: string;
    }): Promise<{
        ok: boolean;
        count: any;
    }>;
    getEventOddsFromCache(eventId: string): Promise<{
        id: string;
        sport_key: string;
        home_team: string;
        away_team: string;
        commence_time: Date | null;
        last_update: Date | null;
        bookmakers: any[];
    } | null>;
}

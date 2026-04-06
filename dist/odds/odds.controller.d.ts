import { OddsService } from './odds.service';
import { OddsQueryDto } from './dto/odds-query.dto';
export declare class OddsController {
    private readonly oddsService;
    constructor(oddsService: OddsService);
    sports(): Promise<any>;
    markets(query: OddsQueryDto): Promise<any>;
    refresh(query: OddsQueryDto): Promise<{
        ok: boolean;
        count: any;
    }>;
}

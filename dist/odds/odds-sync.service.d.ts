import { OddsService } from './odds.service';
export declare class OddsSyncService {
    private readonly oddsService;
    private readonly logger;
    constructor(oddsService: OddsService);
    syncSoccer(): Promise<void>;
}

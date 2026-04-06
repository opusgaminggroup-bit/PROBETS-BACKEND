import { DataSource, Repository } from 'typeorm';
import { Bet } from './entities/bet.entity';
import { OddsService } from '../odds/odds.service';
export declare class SportsSettlementService {
    private readonly dataSource;
    private readonly betRepo;
    private readonly oddsService;
    private readonly logger;
    constructor(dataSource: DataSource, betRepo: Repository<Bet>, oddsService: OddsService);
    private normalizeName;
    private toNum;
    private getHomeAwayScores;
    private parseTotalSelection;
    private parseSpreadSelection;
    private determineH2HResult;
    private determineTotalsResult;
    private determineSpreadsResult;
    private determineResult;
    settleSportsBets(): Promise<void>;
}

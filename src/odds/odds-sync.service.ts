import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OddsService } from './odds.service';

@Injectable()
export class OddsSyncService {
  private readonly logger = new Logger(OddsSyncService.name);

  constructor(private readonly oddsService: OddsService) {}

  @Cron('*/20 * * * * *')
  async syncSoccer() {
    try {
      await this.oddsService.refreshSportOdds({
        sport: process.env.ODDS_DEFAULT_SPORT ?? 'soccer_epl',
        regions: process.env.ODDS_DEFAULT_REGIONS ?? 'eu',
        markets: process.env.ODDS_DEFAULT_MARKETS ?? 'h2h,spreads,totals',
      });
    } catch (error) {
      this.logger.warn(`Odds sync failed: ${error?.message ?? error}`);
    }
  }
}

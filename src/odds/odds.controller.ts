import { Controller, Get, Post, Query } from '@nestjs/common';
import { OddsService } from './odds.service';
import { OddsQueryDto } from './dto/odds-query.dto';

@Controller('odds')
export class OddsController {
  constructor(private readonly oddsService: OddsService) {}

  @Get('sports')
  sports() {
    return this.oddsService.getSports();
  }

  @Get('markets')
  markets(@Query() query: OddsQueryDto) {
    return this.oddsService.getOdds(query);
  }

  @Post('refresh')
  refresh(@Query() query: OddsQueryDto) {
    return this.oddsService.refreshSportOdds(query);
  }
}

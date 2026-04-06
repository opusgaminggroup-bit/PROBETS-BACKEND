import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BetsService } from './bets.service';
import { PlaceBetDto } from './dto/place-bet.dto';
import { SettleBetDto } from './dto/settle-bet.dto';
import { PlaceDiceBetDto } from './dto/place-dice-bet.dto';
import { VerifyDiceDto } from './dto/verify-dice.dto';
import { PlacePlinkoBetDto } from './dto/place-plinko-bet.dto';
import { VerifyPlinkoDto } from './dto/verify-plinko.dto';
import { PlaceBaccaratBetDto } from './dto/place-baccarat-bet.dto';
import { VerifyBaccaratDto } from './dto/verify-baccarat.dto';
import { PlaceSportsBetDto } from './dto/place-sports-bet.dto';

@Controller('bets')
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Post('place')
  place(@Body() dto: PlaceBetDto) {
    return this.betsService.placeBet(dto);
  }

  @Post('sports/place')
  placeSports(@Body() dto: PlaceSportsBetDto) {
    return this.betsService.placeSportsBet(dto);
  }

  @Post('dice/place')
  placeDice(@Body() dto: PlaceDiceBetDto) {
    return this.betsService.placeDiceBet(dto);
  }

  @Post('dice/verify')
  verifyDice(@Body() dto: VerifyDiceDto) {
    return this.betsService.verifyDice(dto);
  }

  @Post('plinko/place')
  placePlinko(@Body() dto: PlacePlinkoBetDto) {
    return this.betsService.placePlinkoBet(dto);
  }

  @Post('plinko/verify')
  verifyPlinko(@Body() dto: VerifyPlinkoDto) {
    return this.betsService.verifyPlinko(dto);
  }

  @Post('baccarat/place')
  placeBaccarat(@Body() dto: PlaceBaccaratBetDto) {
    return this.betsService.placeBaccaratBet(dto);
  }

  @Post('baccarat/verify')
  verifyBaccarat(@Body() dto: VerifyBaccaratDto) {
    return this.betsService.verifyBaccarat(dto);
  }

  @Get('fairness/:userId/hash')
  getSeedHash(@Param('userId') userId: string) {
    return this.betsService.getCurrentServerSeedHash(userId);
  }

  @Post('fairness/:userId/rotate-seed')
  rotateSeed(@Param('userId') userId: string) {
    return this.betsService.rotateSeed(userId);
  }

  @Post('settle')
  settle(@Body() dto: SettleBetDto) {
    return this.betsService.settleBet(dto);
  }

  @Get('recent')
  recent(@Query('userId') userId?: string) {
    return this.betsService.listRecent(userId);
  }

  @Get('risk/exposure')
  exposure(
    @Query('userId') userId: string,
    @Query('eventId') eventId?: string,
    @Query('marketKey') marketKey?: string,
  ) {
    return this.betsService.getExposure(userId, eventId, marketKey);
  }

  @Get('sports/queue')
  queue(@Query('userId') userId?: string, @Query('status') status?: string) {
    return this.betsService.listQueue(userId, status);
  }

  @Post('sports/queue/:queueId/retry')
  retryQueue(@Param('queueId') queueId: string) {
    return this.betsService.retryQueue(queueId);
  }

  @Post('sports/queue/:queueId/cancel')
  cancelQueue(@Param('queueId') queueId: string) {
    return this.betsService.cancelQueue(queueId);
  }

  @Get('sports/queue/metrics')
  queueMetrics(@Query('hours') hours?: string) {
    return this.betsService.queueMetrics(Number(hours ?? 24));
  }

  @Get('risk/overview')
  riskOverview(
    @Query('limit') limit?: string,
    @Query('sportKey') sportKey?: string,
    @Query('marketKey') marketKey?: string,
  ) {
    return this.betsService.riskOverview(Number(limit ?? 50), sportKey, marketKey);
  }

  @Get('ops/dashboard')
  dashboard(
    @Query('hours') hours?: string,
    @Query('limit') limit?: string,
    @Query('sportKey') sportKey?: string,
    @Query('marketKey') marketKey?: string,
  ) {
    return this.betsService.dashboardSummary(
      Number(hours ?? 24),
      Number(limit ?? 30),
      sportKey,
      marketKey,
    );
  }

  @Get('ops/queue-pause')
  queuePauseStatus() {
    return this.betsService.getQueuePauseStatus();
  }

  @Post('ops/queue-pause/:minutes')
  setQueuePause(@Param('minutes') minutes: string) {
    return this.betsService.setQueuePause(Number(minutes));
  }
}

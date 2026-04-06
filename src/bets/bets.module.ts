import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bet } from './entities/bet.entity';
import { BetExposure } from './entities/bet-exposure.entity';
import { SportsBetQueue } from './entities/sports-bet-queue.entity';
import { User } from '../users/entities/user.entity';
import { CreditTransaction } from '../credit/entities/credit-transaction.entity';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';
import { ProvablyFairModule } from '../provably-fair/provably-fair.module';
import { FairSeedState } from '../provably-fair/entities/fair-seed-state.entity';
import { OddsModule } from '../odds/odds.module';
import { SportsSettlementService } from './sports-settlement.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bet,
      BetExposure,
      SportsBetQueue,
      User,
      CreditTransaction,
      FairSeedState,
    ]),
    ProvablyFairModule,
    OddsModule,
  ],
  controllers: [BetsController],
  providers: [BetsService, SportsSettlementService],
  exports: [BetsService],
})
export class BetsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Bet } from '../bets/entities/bet.entity';
import { CreditTransaction } from '../credit/entities/credit-transaction.entity';
import { BetExposure } from '../bets/entities/bet-exposure.entity';
import { SportsBetQueue } from '../bets/entities/sports-bet-queue.entity';
import { RolesGuard } from '../auth/roles.guard';
import { LiveCasinoSession } from '../live-casino/entities/live-casino-session.entity';
import { LiveCasinoModule } from '../live-casino/live-casino.module';
import { BetsModule } from '../bets/bets.module';
import { CreditModule } from '../credit/credit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Bet, CreditTransaction, BetExposure, SportsBetQueue, LiveCasinoSession]),
    LiveCasinoModule,
    BetsModule,
    CreditModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
  exports: [AdminService],
})
export class AdminModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveCasinoController } from './live-casino.controller';
import { LiveCasinoService } from './live-casino.service';
import { LiveCasinoSession } from './entities/live-casino-session.entity';
import { User } from '../users/entities/user.entity';
import { Bet } from '../bets/entities/bet.entity';
import { CreditTransaction } from '../credit/entities/credit-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LiveCasinoSession, User, Bet, CreditTransaction])],
  controllers: [LiveCasinoController],
  providers: [LiveCasinoService],
  exports: [LiveCasinoService],
})
export class LiveCasinoModule {}

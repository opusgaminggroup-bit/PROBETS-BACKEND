import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { DataSource, Repository } from 'typeorm';
import { Bet } from './entities/bet.entity';
import { BetType } from '../common/enums/bet-type.enum';
import { BetResultStatus } from '../common/enums/bet-result-status.enum';
import { OddsService } from '../odds/odds.service';
import { User } from '../users/entities/user.entity';
import { CreditTransaction } from '../credit/entities/credit-transaction.entity';
import { CreditTransactionType } from '../common/enums/credit-transaction-type.enum';

@Injectable()
export class SportsSettlementService {
  private readonly logger = new Logger(SportsSettlementService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Bet) private readonly betRepo: Repository<Bet>,
    private readonly oddsService: OddsService,
  ) {}

  private normalizeName(name: string) {
    return String(name ?? '').trim().toLowerCase();
  }

  private toNum(val: unknown): number {
    const n = Number(val ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  private getHomeAwayScores(scoreItem: any) {
    const scores = scoreItem?.scores ?? [];
    const home = scores.find((s: any) => this.normalizeName(s.name) === this.normalizeName(scoreItem.home_team));
    const away = scores.find((s: any) => this.normalizeName(s.name) === this.normalizeName(scoreItem.away_team));

    return {
      home: this.toNum(home?.score),
      away: this.toNum(away?.score),
    };
  }

  private parseTotalSelection(selection: string): { side: 'over' | 'under'; line: number } | null {
    const raw = String(selection ?? '').trim().toLowerCase();
    const m = raw.match(/^(over|under)\s*([+-]?\d+(?:\.\d+)?)$/i);
    if (!m) return null;

    return { side: m[1].toLowerCase() as 'over' | 'under', line: Number(m[2]) };
  }

  private parseSpreadSelection(selection: string, homeTeam: string, awayTeam: string): { side: 'home' | 'away'; handicap: number } | null {
    const raw = String(selection ?? '').trim();
    const m = raw.match(/^(.*)\s+([+-]?\d+(?:\.\d+)?)$/);
    if (!m) return null;

    const teamRaw = this.normalizeName(m[1]);
    const handicap = Number(m[2]);

    const homeNorm = this.normalizeName(homeTeam);
    const awayNorm = this.normalizeName(awayTeam);

    if (teamRaw === 'home' || teamRaw === homeNorm) return { side: 'home', handicap };
    if (teamRaw === 'away' || teamRaw === awayNorm) return { side: 'away', handicap };

    return null;
  }

  private determineH2HResult(bet: Bet, scoreItem: any): BetResultStatus {
    const completed = !!scoreItem?.completed;
    if (!completed) return BetResultStatus.PENDING;

    const { home: homeScore, away: awayScore } = this.getHomeAwayScores(scoreItem);
    const sel = this.normalizeName(bet.selection ?? '');

    if (homeScore === awayScore) {
      return sel === 'draw' || sel === 'tie' ? BetResultStatus.WIN : BetResultStatus.LOSS;
    }
    if (homeScore > awayScore) {
      return sel === this.normalizeName(scoreItem.home_team) || sel === 'home' ? BetResultStatus.WIN : BetResultStatus.LOSS;
    }
    return sel === this.normalizeName(scoreItem.away_team) || sel === 'away' ? BetResultStatus.WIN : BetResultStatus.LOSS;
  }

  private determineTotalsResult(bet: Bet, scoreItem: any): BetResultStatus {
    const completed = !!scoreItem?.completed;
    if (!completed) return BetResultStatus.PENDING;

    const parsed = this.parseTotalSelection(bet.selection ?? '');
    if (!parsed) return BetResultStatus.PENDING;

    const { home, away } = this.getHomeAwayScores(scoreItem);
    const total = home + away;

    if (total === parsed.line) return BetResultStatus.PUSH;
    if (parsed.side === 'over') return total > parsed.line ? BetResultStatus.WIN : BetResultStatus.LOSS;
    return total < parsed.line ? BetResultStatus.WIN : BetResultStatus.LOSS;
  }

  private determineSpreadsResult(bet: Bet, scoreItem: any): BetResultStatus {
    const completed = !!scoreItem?.completed;
    if (!completed) return BetResultStatus.PENDING;

    const parsed = this.parseSpreadSelection(bet.selection ?? '', scoreItem.home_team, scoreItem.away_team);
    if (!parsed) return BetResultStatus.PENDING;

    const { home, away } = this.getHomeAwayScores(scoreItem);

    const adjusted = parsed.side === 'home' ? home + parsed.handicap - away : away + parsed.handicap - home;

    if (adjusted === 0) return BetResultStatus.PUSH;
    return adjusted > 0 ? BetResultStatus.WIN : BetResultStatus.LOSS;
  }

  private determineResult(bet: Bet, scoreItem: any): BetResultStatus {
    if (bet.marketKey === 'h2h') return this.determineH2HResult(bet, scoreItem);
    if (bet.marketKey === 'totals') return this.determineTotalsResult(bet, scoreItem);
    if (bet.marketKey === 'spreads') return this.determineSpreadsResult(bet, scoreItem);
    return BetResultStatus.PENDING;
  }

  @Cron('*/30 * * * * *')
  async settleSportsBets() {
    const pending = await this.betRepo.find({
      where: { betType: BetType.SPORTS, resultStatus: BetResultStatus.PENDING },
      take: 200,
      order: { createdAt: 'ASC' },
    });

    for (const bet of pending) {
      try {
        const snapshot = bet.apiSnapshot as any;
        const sportKey = snapshot?.sport_key;
        if (!sportKey) continue;

        const scores = await this.oddsService.getScores(sportKey);
        const scoreItem = (scores ?? []).find((s: any) => s.id === bet.eventId);
        if (!scoreItem) continue;

        const result = this.determineResult(bet, scoreItem);
        if (result === BetResultStatus.PENDING) continue;

        await this.dataSource.transaction(async (manager) => {
          const lockedBet = await manager.findOne(Bet, {
            where: { id: bet.id },
            lock: { mode: 'pessimistic_write' },
          });
          if (!lockedBet || lockedBet.resultStatus !== BetResultStatus.PENDING) return;

          const user = await manager.findOne(User, {
            where: { id: lockedBet.userId },
            lock: { mode: 'pessimistic_write' },
          });
          if (!user) return;

          const before = Number(user.creditBalance);
          const stake = Number(lockedBet.amount);
          const potential = Number(lockedBet.potentialPayout ?? 0);

          let payout = 0;
          let txType = CreditTransactionType.BET_LOSS;

          if (result === BetResultStatus.WIN) {
            payout = potential;
            txType = CreditTransactionType.BET_WIN;
          } else if (result === BetResultStatus.PUSH || result === BetResultStatus.CANCEL) {
            payout = stake;
            txType = CreditTransactionType.BET_PUSH;
          }

          const after = before + payout;
          user.creditBalance = after.toFixed(2);
          await manager.save(User, user);

          lockedBet.resultStatus = result;
          lockedBet.payout = payout.toFixed(2);
          lockedBet.settledAt = new Date();
          await manager.save(Bet, lockedBet);

          await manager.save(
            CreditTransaction,
            manager.create(CreditTransaction, {
              userId: user.id,
              operatorId: process.env.SYSTEM_ADMIN_ID ?? '1',
              amount: payout.toFixed(2),
              type: txType,
              referenceId: lockedBet.betNo,
              remark: `sports auto settle ${result}`,
              balanceBefore: before.toFixed(2),
              balanceAfter: after.toFixed(2),
            }),
          );
        });
      } catch (error) {
        this.logger.warn(`Settle failed bet ${bet.betNo}: ${error?.message ?? error}`);
      }
    }
  }
}

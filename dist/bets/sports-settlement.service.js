"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SportsSettlementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SportsSettlementService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const typeorm_2 = require("typeorm");
const bet_entity_1 = require("./entities/bet.entity");
const bet_type_enum_1 = require("../common/enums/bet-type.enum");
const bet_result_status_enum_1 = require("../common/enums/bet-result-status.enum");
const odds_service_1 = require("../odds/odds.service");
const user_entity_1 = require("../users/entities/user.entity");
const credit_transaction_entity_1 = require("../credit/entities/credit-transaction.entity");
const credit_transaction_type_enum_1 = require("../common/enums/credit-transaction-type.enum");
let SportsSettlementService = SportsSettlementService_1 = class SportsSettlementService {
    dataSource;
    betRepo;
    oddsService;
    logger = new common_1.Logger(SportsSettlementService_1.name);
    constructor(dataSource, betRepo, oddsService) {
        this.dataSource = dataSource;
        this.betRepo = betRepo;
        this.oddsService = oddsService;
    }
    normalizeName(name) {
        return String(name ?? '').trim().toLowerCase();
    }
    toNum(val) {
        const n = Number(val ?? 0);
        return Number.isFinite(n) ? n : 0;
    }
    getHomeAwayScores(scoreItem) {
        const scores = scoreItem?.scores ?? [];
        const home = scores.find((s) => this.normalizeName(s.name) === this.normalizeName(scoreItem.home_team));
        const away = scores.find((s) => this.normalizeName(s.name) === this.normalizeName(scoreItem.away_team));
        return {
            home: this.toNum(home?.score),
            away: this.toNum(away?.score),
        };
    }
    parseTotalSelection(selection) {
        const raw = String(selection ?? '').trim().toLowerCase();
        const m = raw.match(/^(over|under)\s*([+-]?\d+(?:\.\d+)?)$/i);
        if (!m)
            return null;
        return { side: m[1].toLowerCase(), line: Number(m[2]) };
    }
    parseSpreadSelection(selection, homeTeam, awayTeam) {
        const raw = String(selection ?? '').trim();
        const m = raw.match(/^(.*)\s+([+-]?\d+(?:\.\d+)?)$/);
        if (!m)
            return null;
        const teamRaw = this.normalizeName(m[1]);
        const handicap = Number(m[2]);
        const homeNorm = this.normalizeName(homeTeam);
        const awayNorm = this.normalizeName(awayTeam);
        if (teamRaw === 'home' || teamRaw === homeNorm)
            return { side: 'home', handicap };
        if (teamRaw === 'away' || teamRaw === awayNorm)
            return { side: 'away', handicap };
        return null;
    }
    determineH2HResult(bet, scoreItem) {
        const completed = !!scoreItem?.completed;
        if (!completed)
            return bet_result_status_enum_1.BetResultStatus.PENDING;
        const { home: homeScore, away: awayScore } = this.getHomeAwayScores(scoreItem);
        const sel = this.normalizeName(bet.selection ?? '');
        if (homeScore === awayScore) {
            return sel === 'draw' || sel === 'tie' ? bet_result_status_enum_1.BetResultStatus.WIN : bet_result_status_enum_1.BetResultStatus.LOSS;
        }
        if (homeScore > awayScore) {
            return sel === this.normalizeName(scoreItem.home_team) || sel === 'home' ? bet_result_status_enum_1.BetResultStatus.WIN : bet_result_status_enum_1.BetResultStatus.LOSS;
        }
        return sel === this.normalizeName(scoreItem.away_team) || sel === 'away' ? bet_result_status_enum_1.BetResultStatus.WIN : bet_result_status_enum_1.BetResultStatus.LOSS;
    }
    determineTotalsResult(bet, scoreItem) {
        const completed = !!scoreItem?.completed;
        if (!completed)
            return bet_result_status_enum_1.BetResultStatus.PENDING;
        const parsed = this.parseTotalSelection(bet.selection ?? '');
        if (!parsed)
            return bet_result_status_enum_1.BetResultStatus.PENDING;
        const { home, away } = this.getHomeAwayScores(scoreItem);
        const total = home + away;
        if (total === parsed.line)
            return bet_result_status_enum_1.BetResultStatus.PUSH;
        if (parsed.side === 'over')
            return total > parsed.line ? bet_result_status_enum_1.BetResultStatus.WIN : bet_result_status_enum_1.BetResultStatus.LOSS;
        return total < parsed.line ? bet_result_status_enum_1.BetResultStatus.WIN : bet_result_status_enum_1.BetResultStatus.LOSS;
    }
    determineSpreadsResult(bet, scoreItem) {
        const completed = !!scoreItem?.completed;
        if (!completed)
            return bet_result_status_enum_1.BetResultStatus.PENDING;
        const parsed = this.parseSpreadSelection(bet.selection ?? '', scoreItem.home_team, scoreItem.away_team);
        if (!parsed)
            return bet_result_status_enum_1.BetResultStatus.PENDING;
        const { home, away } = this.getHomeAwayScores(scoreItem);
        const adjusted = parsed.side === 'home' ? home + parsed.handicap - away : away + parsed.handicap - home;
        if (adjusted === 0)
            return bet_result_status_enum_1.BetResultStatus.PUSH;
        return adjusted > 0 ? bet_result_status_enum_1.BetResultStatus.WIN : bet_result_status_enum_1.BetResultStatus.LOSS;
    }
    determineResult(bet, scoreItem) {
        if (bet.marketKey === 'h2h')
            return this.determineH2HResult(bet, scoreItem);
        if (bet.marketKey === 'totals')
            return this.determineTotalsResult(bet, scoreItem);
        if (bet.marketKey === 'spreads')
            return this.determineSpreadsResult(bet, scoreItem);
        return bet_result_status_enum_1.BetResultStatus.PENDING;
    }
    async settleSportsBets() {
        const pending = await this.betRepo.find({
            where: { betType: bet_type_enum_1.BetType.SPORTS, resultStatus: bet_result_status_enum_1.BetResultStatus.PENDING },
            take: 200,
            order: { createdAt: 'ASC' },
        });
        for (const bet of pending) {
            try {
                const snapshot = bet.apiSnapshot;
                const sportKey = snapshot?.sport_key;
                if (!sportKey)
                    continue;
                const scores = await this.oddsService.getScores(sportKey);
                const scoreItem = (scores ?? []).find((s) => s.id === bet.eventId);
                if (!scoreItem)
                    continue;
                const result = this.determineResult(bet, scoreItem);
                if (result === bet_result_status_enum_1.BetResultStatus.PENDING)
                    continue;
                await this.dataSource.transaction(async (manager) => {
                    const lockedBet = await manager.findOne(bet_entity_1.Bet, {
                        where: { id: bet.id },
                        lock: { mode: 'pessimistic_write' },
                    });
                    if (!lockedBet || lockedBet.resultStatus !== bet_result_status_enum_1.BetResultStatus.PENDING)
                        return;
                    const user = await manager.findOne(user_entity_1.User, {
                        where: { id: lockedBet.userId },
                        lock: { mode: 'pessimistic_write' },
                    });
                    if (!user)
                        return;
                    const before = Number(user.creditBalance);
                    const stake = Number(lockedBet.amount);
                    const potential = Number(lockedBet.potentialPayout ?? 0);
                    let payout = 0;
                    let txType = credit_transaction_type_enum_1.CreditTransactionType.BET_LOSS;
                    if (result === bet_result_status_enum_1.BetResultStatus.WIN) {
                        payout = potential;
                        txType = credit_transaction_type_enum_1.CreditTransactionType.BET_WIN;
                    }
                    else if (result === bet_result_status_enum_1.BetResultStatus.PUSH || result === bet_result_status_enum_1.BetResultStatus.CANCEL) {
                        payout = stake;
                        txType = credit_transaction_type_enum_1.CreditTransactionType.BET_PUSH;
                    }
                    const after = before + payout;
                    user.creditBalance = after.toFixed(2);
                    await manager.save(user_entity_1.User, user);
                    lockedBet.resultStatus = result;
                    lockedBet.payout = payout.toFixed(2);
                    lockedBet.settledAt = new Date();
                    await manager.save(bet_entity_1.Bet, lockedBet);
                    await manager.save(credit_transaction_entity_1.CreditTransaction, manager.create(credit_transaction_entity_1.CreditTransaction, {
                        userId: user.id,
                        operatorId: process.env.SYSTEM_ADMIN_ID ?? '1',
                        amount: payout.toFixed(2),
                        type: txType,
                        referenceId: lockedBet.betNo,
                        remark: `sports auto settle ${result}`,
                        balanceBefore: before.toFixed(2),
                        balanceAfter: after.toFixed(2),
                    }));
                });
            }
            catch (error) {
                this.logger.warn(`Settle failed bet ${bet.betNo}: ${error?.message ?? error}`);
            }
        }
    }
};
exports.SportsSettlementService = SportsSettlementService;
__decorate([
    (0, schedule_1.Cron)('*/30 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SportsSettlementService.prototype, "settleSportsBets", null);
exports.SportsSettlementService = SportsSettlementService = SportsSettlementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __param(1, (0, typeorm_1.InjectRepository)(bet_entity_1.Bet)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        odds_service_1.OddsService])
], SportsSettlementService);
//# sourceMappingURL=sports-settlement.service.js.map
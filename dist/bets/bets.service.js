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
var BetsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const bet_entity_1 = require("./entities/bet.entity");
const user_entity_1 = require("../users/entities/user.entity");
const credit_transaction_entity_1 = require("../credit/entities/credit-transaction.entity");
const credit_transaction_type_enum_1 = require("../common/enums/credit-transaction-type.enum");
const bet_result_status_enum_1 = require("../common/enums/bet-result-status.enum");
const provably_fair_service_1 = require("../provably-fair/provably-fair.service");
const bet_type_enum_1 = require("../common/enums/bet-type.enum");
const fair_seed_state_entity_1 = require("../provably-fair/entities/fair-seed-state.entity");
const odds_service_1 = require("../odds/odds.service");
const bet_exposure_entity_1 = require("./entities/bet-exposure.entity");
const sports_bet_queue_entity_1 = require("./entities/sports-bet-queue.entity");
let BetsService = BetsService_1 = class BetsService {
    dataSource;
    betRepo;
    fairService;
    oddsService;
    logger = new common_1.Logger(BetsService_1.name);
    liveQueuePausedUntil = null;
    constructor(dataSource, betRepo, fairService, oddsService) {
        this.dataSource = dataSource;
        this.betRepo = betRepo;
        this.fairService = fairService;
        this.oddsService = oddsService;
    }
    async getOrCreateSeedState(manager, userId) {
        let state = await manager.findOne(fair_seed_state_entity_1.FairSeedState, {
            where: { userId },
            lock: { mode: 'pessimistic_write' },
        });
        if (!state) {
            const serverSeed = this.fairService.generateServerSeed();
            state = manager.create(fair_seed_state_entity_1.FairSeedState, {
                userId,
                currentServerSeed: serverSeed,
                currentServerSeedHash: this.fairService.getServerSeedHash(serverSeed),
                nonce: 0,
            });
            state = await manager.save(fair_seed_state_entity_1.FairSeedState, state);
        }
        return state;
    }
    async rotateSeed(userId) {
        return this.dataSource.transaction(async (manager) => {
            const state = await this.getOrCreateSeedState(manager, userId);
            const revealedServerSeed = state.currentServerSeed;
            const revealedServerSeedHash = state.currentServerSeedHash;
            const nextServerSeed = this.fairService.generateServerSeed();
            state.lastRevealedServerSeed = revealedServerSeed;
            state.lastRevealedServerSeedHash = revealedServerSeedHash;
            state.currentServerSeed = nextServerSeed;
            state.currentServerSeedHash = this.fairService.getServerSeedHash(nextServerSeed);
            state.nonce = 0;
            await manager.save(fair_seed_state_entity_1.FairSeedState, state);
            return {
                ok: true,
                revealedServerSeed,
                revealedServerSeedHash,
                nextServerSeedHash: state.currentServerSeedHash,
            };
        });
    }
    async getCurrentServerSeedHash(userId) {
        return this.dataSource.transaction(async (manager) => {
            const state = await this.getOrCreateSeedState(manager, userId);
            return {
                userId,
                serverSeedHash: state.currentServerSeedHash,
                nextNonce: state.nonce,
            };
        });
    }
    verifyDice(dto) {
        return this.fairService.verifyDice(dto);
    }
    verifyPlinko(dto) {
        return this.fairService.verifyPlinko(dto);
    }
    verifyBaccarat(dto) {
        return this.fairService.verifyBaccarat(dto);
    }
    async placeDiceBet(dto) {
        return this.dataSource.transaction(async (manager) => {
            const user = await manager.findOne(user_entity_1.User, {
                where: { id: dto.userId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            const state = await this.getOrCreateSeedState(manager, dto.userId);
            const nonce = state.nonce;
            state.nonce += 1;
            await manager.save(fair_seed_state_entity_1.FairSeedState, state);
            const amount = Number(dto.amount);
            const before = Number(user.creditBalance);
            if (before < amount)
                throw new common_1.BadRequestException('Insufficient credit');
            const roll = this.fairService.calculateDiceRoll(state.currentServerSeed, dto.clientSeed, nonce);
            const win = dto.isUnder ? roll < dto.target : roll > dto.target;
            const prob = dto.isUnder ? dto.target / 100 : (100 - dto.target) / 100;
            const multiplier = 0.99 / prob;
            const payout = win ? Number((amount * multiplier).toFixed(2)) : 0;
            const afterPlace = before - amount;
            const afterSettle = afterPlace + payout;
            user.creditBalance = afterSettle.toFixed(2);
            await manager.save(user_entity_1.User, user);
            const betNo = `DICE${Date.now()}${Math.floor(Math.random() * 1000)}`;
            const bet = manager.create(bet_entity_1.Bet, {
                betNo,
                userId: user.id,
                betType: bet_type_enum_1.BetType.DICE,
                amount: amount.toFixed(2),
                odds: multiplier.toFixed(4),
                resultStatus: win ? bet_result_status_enum_1.BetResultStatus.WIN : bet_result_status_enum_1.BetResultStatus.LOSS,
                payout: payout.toFixed(2),
                serverSeedHash: state.currentServerSeedHash,
                clientSeed: dto.clientSeed,
                nonce,
                fairRoll: roll.toFixed(2),
                fairPathJson: null,
                settledAt: new Date(),
            });
            await manager.save(bet_entity_1.Bet, bet);
            await manager.save(credit_transaction_entity_1.CreditTransaction, manager.create(credit_transaction_entity_1.CreditTransaction, {
                userId: user.id,
                operatorId: user.id,
                amount: (-amount).toFixed(2),
                type: credit_transaction_type_enum_1.CreditTransactionType.BET_PLACE,
                referenceId: betNo,
                remark: 'dice place bet',
                balanceBefore: before.toFixed(2),
                balanceAfter: afterPlace.toFixed(2),
            }));
            await manager.save(credit_transaction_entity_1.CreditTransaction, manager.create(credit_transaction_entity_1.CreditTransaction, {
                userId: user.id,
                operatorId: process.env.SYSTEM_ADMIN_ID ?? '1',
                amount: win ? payout.toFixed(2) : '0.00',
                type: win ? credit_transaction_type_enum_1.CreditTransactionType.BET_WIN : credit_transaction_type_enum_1.CreditTransactionType.BET_LOSS,
                referenceId: betNo,
                remark: win ? 'dice settled win' : 'dice settled loss',
                balanceBefore: afterPlace.toFixed(2),
                balanceAfter: afterSettle.toFixed(2),
            }));
            return {
                ok: true,
                game: 'dice',
                betNo,
                roll,
                win,
                payout,
                target: dto.target,
                isUnder: dto.isUnder,
                serverSeedHash: state.currentServerSeedHash,
                clientSeed: dto.clientSeed,
                nonce,
                balanceBefore: before,
                balanceAfter: afterSettle,
            };
        });
    }
    async placePlinkoBet(dto) {
        return this.dataSource.transaction(async (manager) => {
            const user = await manager.findOne(user_entity_1.User, {
                where: { id: dto.userId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            const state = await this.getOrCreateSeedState(manager, dto.userId);
            const nonce = state.nonce;
            state.nonce += 1;
            await manager.save(fair_seed_state_entity_1.FairSeedState, state);
            const amount = Number(dto.amount);
            const before = Number(user.creditBalance);
            if (before < amount)
                throw new common_1.BadRequestException('Insufficient credit');
            const path = this.fairService.calculatePlinkoPath(state.currentServerSeed, dto.clientSeed, nonce, dto.rows);
            const slot = this.fairService.getPlinkoSlot(path);
            const multiplier = this.fairService.getPlinkoMultiplier(dto.rows, dto.risk, slot);
            const payout = Number((amount * multiplier).toFixed(2));
            const win = payout > amount;
            const afterPlace = before - amount;
            const afterSettle = afterPlace + payout;
            user.creditBalance = afterSettle.toFixed(2);
            await manager.save(user_entity_1.User, user);
            const betNo = `PLK${Date.now()}${Math.floor(Math.random() * 1000)}`;
            const bet = manager.create(bet_entity_1.Bet, {
                betNo,
                userId: user.id,
                betType: bet_type_enum_1.BetType.PLINKO,
                amount: amount.toFixed(2),
                odds: multiplier.toFixed(4),
                resultStatus: payout > 0 ? bet_result_status_enum_1.BetResultStatus.WIN : bet_result_status_enum_1.BetResultStatus.LOSS,
                payout: payout.toFixed(2),
                serverSeedHash: state.currentServerSeedHash,
                clientSeed: dto.clientSeed,
                nonce,
                fairRoll: null,
                fairPathJson: { path, slot, risk: dto.risk, rows: dto.rows, multiplier },
                settledAt: new Date(),
            });
            await manager.save(bet_entity_1.Bet, bet);
            await manager.save(credit_transaction_entity_1.CreditTransaction, manager.create(credit_transaction_entity_1.CreditTransaction, {
                userId: user.id,
                operatorId: user.id,
                amount: (-amount).toFixed(2),
                type: credit_transaction_type_enum_1.CreditTransactionType.BET_PLACE,
                referenceId: betNo,
                remark: 'plinko place bet',
                balanceBefore: before.toFixed(2),
                balanceAfter: afterPlace.toFixed(2),
            }));
            await manager.save(credit_transaction_entity_1.CreditTransaction, manager.create(credit_transaction_entity_1.CreditTransaction, {
                userId: user.id,
                operatorId: process.env.SYSTEM_ADMIN_ID ?? '1',
                amount: payout.toFixed(2),
                type: payout > 0 ? credit_transaction_type_enum_1.CreditTransactionType.BET_WIN : credit_transaction_type_enum_1.CreditTransactionType.BET_LOSS,
                referenceId: betNo,
                remark: win ? 'plinko settled win' : 'plinko settled loss',
                balanceBefore: afterPlace.toFixed(2),
                balanceAfter: afterSettle.toFixed(2),
            }));
            return {
                ok: true,
                game: 'plinko',
                betNo,
                path,
                slot,
                rows: dto.rows,
                risk: dto.risk,
                multiplier,
                payout,
                serverSeedHash: state.currentServerSeedHash,
                clientSeed: dto.clientSeed,
                nonce,
                balanceBefore: before,
                balanceAfter: afterSettle,
            };
        });
    }
    async placeBaccaratBet(dto) {
        return this.dataSource.transaction(async (manager) => {
            const user = await manager.findOne(user_entity_1.User, {
                where: { id: dto.userId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            const state = await this.getOrCreateSeedState(manager, dto.userId);
            const nonce = state.nonce;
            state.nonce += 1;
            await manager.save(fair_seed_state_entity_1.FairSeedState, state);
            const amount = Number(dto.amount);
            const before = Number(user.creditBalance);
            if (before < amount)
                throw new common_1.BadRequestException('Insufficient credit');
            const result = this.fairService.calculateBaccarat(state.currentServerSeed, dto.clientSeed, nonce);
            let multiplier = 0;
            if (dto.betOn === 'player')
                multiplier = result.winner === 'player' ? 2.0 : 0;
            if (dto.betOn === 'banker')
                multiplier = result.winner === 'banker' ? 1.95 : 0;
            if (dto.betOn === 'tie')
                multiplier = result.winner === 'tie' ? 9.0 : 0;
            const payout = Number((amount * multiplier).toFixed(2));
            const win = payout > 0;
            const afterPlace = before - amount;
            const afterSettle = afterPlace + payout;
            user.creditBalance = afterSettle.toFixed(2);
            await manager.save(user_entity_1.User, user);
            const betNo = `BAC${Date.now()}${Math.floor(Math.random() * 1000)}`;
            const bet = manager.create(bet_entity_1.Bet, {
                betNo,
                userId: user.id,
                betType: bet_type_enum_1.BetType.BACCARAT,
                amount: amount.toFixed(2),
                odds: multiplier.toFixed(4),
                resultStatus: win ? bet_result_status_enum_1.BetResultStatus.WIN : bet_result_status_enum_1.BetResultStatus.LOSS,
                payout: payout.toFixed(2),
                serverSeedHash: state.currentServerSeedHash,
                clientSeed: dto.clientSeed,
                nonce,
                fairRoll: null,
                fairPathJson: {
                    game: 'baccarat',
                    betOn: dto.betOn,
                    winner: result.winner,
                    playerScore: result.playerScore,
                    bankerScore: result.bankerScore,
                    cards: result.cards,
                    multiplier,
                },
                settledAt: new Date(),
            });
            await manager.save(bet_entity_1.Bet, bet);
            await manager.save(credit_transaction_entity_1.CreditTransaction, manager.create(credit_transaction_entity_1.CreditTransaction, {
                userId: user.id,
                operatorId: user.id,
                amount: (-amount).toFixed(2),
                type: credit_transaction_type_enum_1.CreditTransactionType.BET_PLACE,
                referenceId: betNo,
                remark: 'baccarat place bet',
                balanceBefore: before.toFixed(2),
                balanceAfter: afterPlace.toFixed(2),
            }));
            await manager.save(credit_transaction_entity_1.CreditTransaction, manager.create(credit_transaction_entity_1.CreditTransaction, {
                userId: user.id,
                operatorId: process.env.SYSTEM_ADMIN_ID ?? '1',
                amount: payout.toFixed(2),
                type: win ? credit_transaction_type_enum_1.CreditTransactionType.BET_WIN : credit_transaction_type_enum_1.CreditTransactionType.BET_LOSS,
                referenceId: betNo,
                remark: win ? 'baccarat settled win' : 'baccarat settled loss',
                balanceBefore: afterPlace.toFixed(2),
                balanceAfter: afterSettle.toFixed(2),
            }));
            return {
                ok: true,
                game: 'baccarat',
                betNo,
                betOn: dto.betOn,
                winner: result.winner,
                playerScore: result.playerScore,
                bankerScore: result.bankerScore,
                cards: result.cards,
                multiplier,
                payout,
                serverSeedHash: state.currentServerSeedHash,
                clientSeed: dto.clientSeed,
                nonce,
                balanceBefore: before,
                balanceAfter: afterSettle,
            };
        });
    }
    maxStakePerBet() {
        return Number(process.env.SPORTS_MAX_STAKE_PER_BET ?? 10000);
    }
    maxExposurePerUserEventMarket() {
        return Number(process.env.SPORTS_MAX_EXPOSURE_PER_USER_EVENT_MARKET ?? 50000);
    }
    delaySeconds() {
        return Number(process.env.SPORTS_LIVE_DELAY_SECONDS ?? 8);
    }
    queueEnabled() {
        const enabled = String(process.env.SPORTS_LIVE_QUEUE_ENABLED ?? '1') !== '0';
        if (!enabled)
            return false;
        if (this.liveQueuePausedUntil && this.liveQueuePausedUntil.getTime() > Date.now()) {
            return false;
        }
        return true;
    }
    maxQueueAttempts() {
        return Number(process.env.SPORTS_LIVE_QUEUE_MAX_ATTEMPTS ?? 10);
    }
    marginPct() {
        return Number(process.env.SPORTS_MARGIN_PCT ?? 0);
    }
    applyMargin(rawOdds) {
        const margin = this.marginPct();
        if (!margin || margin <= 0)
            return rawOdds;
        const adjusted = rawOdds * (1 - margin / 100);
        return Number(Math.max(1.01, adjusted).toFixed(4));
    }
    isLiveEvent(event) {
        const commence = event?.commence_time ? new Date(event.commence_time).getTime() : null;
        if (!commence)
            return false;
        return Date.now() >= commence;
    }
    allowedBookmakers() {
        return String(process.env.SPORTS_ALLOWED_BOOKMAKERS ?? '')
            .split(',')
            .map((x) => x.trim().toLowerCase())
            .filter(Boolean);
    }
    oddsPickMode() {
        const mode = String(process.env.SPORTS_ODDS_PICK ?? 'min').toLowerCase();
        return mode === 'max' ? 'max' : 'min';
    }
    findSelectionOddsFromEvent(event, marketKey, selection) {
        const bookmakers = event?.bookmakers ?? [];
        const allow = this.allowedBookmakers();
        const candidates = [];
        for (const b of bookmakers) {
            const key = String(b?.key ?? '').toLowerCase();
            if (allow.length > 0 && !allow.includes(key))
                continue;
            const mk = (b.markets ?? []).find((m) => m.key === marketKey);
            if (!mk)
                continue;
            const out = (mk.outcomes ?? []).find((o) => String(o.name).toLowerCase() === String(selection).toLowerCase());
            if (out?.price && Number(out.price) > 1.0) {
                candidates.push({ odds: Number(out.price), bookmaker: b.key ?? 'unknown' });
            }
        }
        if (candidates.length === 0)
            return null;
        const mode = this.oddsPickMode();
        return candidates.reduce((best, cur) => {
            if (mode === 'max')
                return cur.odds > best.odds ? cur : best;
            return cur.odds < best.odds ? cur : best;
        });
    }
    async placeSportsBet(dto) {
        return this.dataSource.transaction(async (manager) => {
            const user = await manager.findOne(user_entity_1.User, {
                where: { id: dto.userId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            const stake = Number(dto.stake);
            const before = Number(user.creditBalance);
            if (before < stake)
                throw new common_1.BadRequestException('Insufficient credit');
            if (stake > this.maxStakePerBet()) {
                throw new common_1.BadRequestException(`Stake exceeds limit ${this.maxStakePerBet()}`);
            }
            const event = await this.oddsService.getEventOddsFromCache(dto.eventId);
            if (!event)
                throw new common_1.NotFoundException('Event not found in odds cache');
            if (this.isLiveEvent(event)) {
                if (!this.queueEnabled()) {
                    throw new common_1.BadRequestException(`Live event in delay window. Please retry after ${this.delaySeconds()} seconds`);
                }
                const executeAfter = new Date(Date.now() + this.delaySeconds() * 1000);
                const idempotencyKey = `${dto.userId}|${dto.eventId}|${dto.marketKey}|${dto.selection}|${stake.toFixed(2)}`;
                const existing = await manager.findOne(sports_bet_queue_entity_1.SportsBetQueue, {
                    where: { idempotencyKey, status: 'pending' },
                    lock: { mode: 'pessimistic_write' },
                });
                if (existing) {
                    return {
                        ok: true,
                        queued: true,
                        queueId: existing.id,
                        executeAfter: existing.executeAfter,
                        reason: 'duplicated request merged into existing queue item',
                    };
                }
                const queued = await manager.save(sports_bet_queue_entity_1.SportsBetQueue, manager.create(sports_bet_queue_entity_1.SportsBetQueue, {
                    userId: dto.userId,
                    eventId: dto.eventId,
                    marketKey: dto.marketKey,
                    selection: dto.selection,
                    stake: stake.toFixed(2),
                    status: 'pending',
                    executeAfter,
                    attemptCount: 0,
                    maxAttempts: this.maxQueueAttempts(),
                    idempotencyKey,
                    lastAttemptAt: null,
                    errorMessage: null,
                    betNo: null,
                }));
                return {
                    ok: true,
                    queued: true,
                    queueId: queued.id,
                    executeAfter,
                    reason: `live event queued for ${this.delaySeconds()}s revalidation`,
                };
            }
            const selected = this.findSelectionOddsFromEvent(event, dto.marketKey, dto.selection);
            if (!selected)
                throw new common_1.BadRequestException('Odds changed or selection unavailable');
            const odds = this.applyMargin(Number(selected.odds.toFixed(4)));
            const potentialPayout = Number((stake * odds).toFixed(2));
            let exposure = await manager.findOne(bet_exposure_entity_1.BetExposure, {
                where: {
                    userId: dto.userId,
                    eventId: dto.eventId,
                    marketKey: dto.marketKey,
                },
                lock: { mode: 'pessimistic_write' },
            });
            if (!exposure) {
                exposure = manager.create(bet_exposure_entity_1.BetExposure, {
                    userId: dto.userId,
                    eventId: dto.eventId,
                    marketKey: dto.marketKey,
                    totalStake: '0.00',
                    totalPotentialPayout: '0.00',
                });
            }
            const newExposureStake = Number(exposure.totalStake) + stake;
            if (newExposureStake > this.maxExposurePerUserEventMarket()) {
                throw new common_1.BadRequestException(`Exposure exceeded. max=${this.maxExposurePerUserEventMarket()}, attempted=${newExposureStake}`);
            }
            const newExposurePayout = Number(exposure.totalPotentialPayout) + potentialPayout;
            exposure.totalStake = newExposureStake.toFixed(2);
            exposure.totalPotentialPayout = newExposurePayout.toFixed(2);
            await manager.save(bet_exposure_entity_1.BetExposure, exposure);
            const after = before - stake;
            user.creditBalance = after.toFixed(2);
            await manager.save(user_entity_1.User, user);
            const betNo = `SPT${Date.now()}${Math.floor(Math.random() * 1000)}`;
            await manager.save(bet_entity_1.Bet, manager.create(bet_entity_1.Bet, {
                betNo,
                userId: user.id,
                betType: bet_type_enum_1.BetType.SPORTS,
                eventId: dto.eventId,
                marketKey: dto.marketKey,
                selection: dto.selection,
                amount: stake.toFixed(2),
                odds: odds.toFixed(4),
                potentialPayout: potentialPayout.toFixed(2),
                resultStatus: bet_result_status_enum_1.BetResultStatus.PENDING,
                payout: '0.00',
                apiSnapshot: event,
            }));
            await manager.save(credit_transaction_entity_1.CreditTransaction, manager.create(credit_transaction_entity_1.CreditTransaction, {
                userId: user.id,
                operatorId: user.id,
                amount: (-stake).toFixed(2),
                type: credit_transaction_type_enum_1.CreditTransactionType.BET_PLACE,
                referenceId: betNo,
                remark: `sports place bet ${dto.eventId}/${dto.marketKey}/${dto.selection}`,
                balanceBefore: before.toFixed(2),
                balanceAfter: after.toFixed(2),
            }));
            return {
                ok: true,
                betNo,
                eventId: dto.eventId,
                marketKey: dto.marketKey,
                selection: dto.selection,
                odds,
                bookmaker: selected.bookmaker,
                potentialPayout,
                exposureStake: newExposureStake,
                exposurePotentialPayout: newExposurePayout,
                balanceBefore: before,
                balanceAfter: after,
            };
        });
    }
    async placeBet(dto) {
        return this.dataSource.transaction(async (manager) => {
            const user = await manager.findOne(user_entity_1.User, {
                where: { id: dto.userId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            const amount = Number(dto.amount);
            const before = Number(user.creditBalance);
            if (before < amount)
                throw new common_1.BadRequestException('Insufficient credit');
            const after = before - amount;
            user.creditBalance = after.toFixed(2);
            await manager.save(user_entity_1.User, user);
            const betNo = `BET${Date.now()}${Math.floor(Math.random() * 1000)}`;
            const bet = manager.create(bet_entity_1.Bet, {
                betNo,
                userId: user.id,
                betType: dto.betType,
                amount: amount.toFixed(2),
                eventId: null,
                marketKey: null,
                selection: null,
                odds: dto.odds ? dto.odds.toFixed(4) : null,
                potentialPayout: null,
                resultStatus: bet_result_status_enum_1.BetResultStatus.PENDING,
                payout: '0.00',
            });
            await manager.save(bet_entity_1.Bet, bet);
            await manager.save(credit_transaction_entity_1.CreditTransaction, manager.create(credit_transaction_entity_1.CreditTransaction, {
                userId: user.id,
                operatorId: user.id,
                amount: (-amount).toFixed(2),
                type: credit_transaction_type_enum_1.CreditTransactionType.BET_PLACE,
                referenceId: betNo,
                remark: 'place bet',
                balanceBefore: before.toFixed(2),
                balanceAfter: after.toFixed(2),
            }));
            return { ok: true, betNo, balanceBefore: before, balanceAfter: after };
        });
    }
    async settleBet(dto) {
        return this.dataSource.transaction(async (manager) => {
            const bet = await manager.findOne(bet_entity_1.Bet, {
                where: { betNo: dto.betNo },
                lock: { mode: 'pessimistic_write' },
            });
            if (!bet)
                throw new common_1.NotFoundException('Bet not found');
            if (bet.resultStatus !== bet_result_status_enum_1.BetResultStatus.PENDING) {
                throw new common_1.BadRequestException('Bet already settled');
            }
            const user = await manager.findOne(user_entity_1.User, {
                where: { id: bet.userId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            const before = Number(user.creditBalance);
            let after = before;
            let delta = 0;
            let txType = null;
            if (dto.result === bet_result_status_enum_1.BetResultStatus.WIN) {
                const payout = Number(dto.payout ?? 0);
                if (payout <= 0)
                    throw new common_1.BadRequestException('Payout required for win');
                delta = payout;
                after = before + payout;
                txType = credit_transaction_type_enum_1.CreditTransactionType.BET_WIN;
                bet.payout = payout.toFixed(2);
            }
            else if (dto.result === bet_result_status_enum_1.BetResultStatus.CANCEL) {
                const refund = Number(bet.amount);
                delta = refund;
                after = before + refund;
                txType = credit_transaction_type_enum_1.CreditTransactionType.BET_WIN;
                bet.payout = refund.toFixed(2);
            }
            else {
                delta = 0;
                bet.payout = '0.00';
            }
            user.creditBalance = after.toFixed(2);
            bet.resultStatus = dto.result;
            bet.settledAt = new Date();
            await manager.save(user_entity_1.User, user);
            await manager.save(bet_entity_1.Bet, bet);
            await manager.save(credit_transaction_entity_1.CreditTransaction, manager.create(credit_transaction_entity_1.CreditTransaction, {
                userId: user.id,
                operatorId: dto.operatorId ?? process.env.SYSTEM_ADMIN_ID ?? '1',
                amount: delta.toFixed(2),
                type: txType ?? credit_transaction_type_enum_1.CreditTransactionType.BET_LOSS,
                referenceId: bet.betNo,
                remark: dto.result === bet_result_status_enum_1.BetResultStatus.CANCEL
                    ? 'bet cancel refund'
                    : dto.result === bet_result_status_enum_1.BetResultStatus.WIN
                        ? 'bet settled win'
                        : 'bet settled loss',
                balanceBefore: before.toFixed(2),
                balanceAfter: after.toFixed(2),
            }));
            return {
                ok: true,
                betNo: bet.betNo,
                result: bet.resultStatus,
                balanceBefore: before,
                balanceAfter: after,
            };
        });
    }
    listRecent(userId) {
        return this.betRepo.find({
            where: userId ? { userId } : {},
            order: { createdAt: 'DESC' },
            take: 100,
        });
    }
    async getExposure(userId, eventId, marketKey) {
        const qb = this.dataSource
            .getRepository(bet_exposure_entity_1.BetExposure)
            .createQueryBuilder('e')
            .where('e.user_id = :userId', { userId });
        if (eventId)
            qb.andWhere('e.event_id = :eventId', { eventId });
        if (marketKey)
            qb.andWhere('e.market_key = :marketKey', { marketKey });
        return qb.orderBy('e.updated_at', 'DESC').getMany();
    }
    async listQueue(userId, status) {
        const qb = this.dataSource
            .getRepository(sports_bet_queue_entity_1.SportsBetQueue)
            .createQueryBuilder('q')
            .orderBy('q.created_at', 'DESC')
            .take(100);
        if (userId)
            qb.andWhere('q.user_id = :userId', { userId });
        if (status)
            qb.andWhere('q.status = :status', { status });
        return qb.getMany();
    }
    async retryQueue(queueId) {
        return this.dataSource.transaction(async (manager) => {
            const item = await manager.findOne(sports_bet_queue_entity_1.SportsBetQueue, {
                where: { id: queueId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!item)
                throw new common_1.NotFoundException('Queue item not found');
            item.status = 'pending';
            item.errorMessage = null;
            item.executeAfter = new Date(Date.now() + this.delaySeconds() * 1000);
            await manager.save(sports_bet_queue_entity_1.SportsBetQueue, item);
            return { ok: true, queueId: item.id, status: item.status, executeAfter: item.executeAfter };
        });
    }
    async cancelQueue(queueId) {
        return this.dataSource.transaction(async (manager) => {
            const item = await manager.findOne(sports_bet_queue_entity_1.SportsBetQueue, {
                where: { id: queueId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!item)
                throw new common_1.NotFoundException('Queue item not found');
            if (item.status === 'executed')
                throw new common_1.BadRequestException('Executed queue cannot be canceled');
            item.status = 'canceled';
            item.errorMessage = 'manually canceled';
            await manager.save(sports_bet_queue_entity_1.SportsBetQueue, item);
            return { ok: true, queueId: item.id, status: item.status };
        });
    }
    async queueMetrics(hours = 24) {
        const mins = Math.max(1, Math.min(24 * 30, Number(hours) * 60));
        const rows = await this.dataSource
            .getRepository(sports_bet_queue_entity_1.SportsBetQueue)
            .createQueryBuilder('q')
            .select('q.status', 'status')
            .addSelect('COUNT(1)', 'count')
            .addSelect('AVG(q.attempt_count)', 'avgAttempts')
            .where('q.created_at >= DATE_SUB(NOW(), INTERVAL :mins MINUTE)', { mins })
            .groupBy('q.status')
            .getRawMany();
        const total = rows.reduce((s, r) => s + Number(r.count ?? 0), 0);
        const toNum = (v) => Number(v ?? 0);
        const executed = rows.find((r) => r.status === 'executed');
        const dead = rows.find((r) => r.status === 'dead');
        const failed = rows.find((r) => r.status === 'failed');
        return {
            windowHours: Number(hours),
            total,
            byStatus: rows,
            successRate: total > 0 ? Number((toNum(executed?.count) / total).toFixed(4)) : 0,
            deadRate: total > 0 ? Number((toNum(dead?.count) / total).toFixed(4)) : 0,
            failedRate: total > 0 ? Number((toNum(failed?.count) / total).toFixed(4)) : 0,
            avgAttemptsExecuted: Number(toNum(executed?.avgAttempts).toFixed(2)),
        };
    }
    async riskOverview(limit = 50, sportKey, marketKey) {
        const qb = this.dataSource
            .getRepository(bet_exposure_entity_1.BetExposure)
            .createQueryBuilder('e')
            .innerJoin('events', 'ev', 'ev.event_id = e.event_id')
            .select('e.event_id', 'eventId')
            .addSelect('ev.sport_key', 'sportKey')
            .addSelect('e.market_key', 'marketKey')
            .addSelect('COUNT(DISTINCT e.user_id)', 'userCount')
            .addSelect('SUM(e.total_stake)', 'totalStake')
            .addSelect('SUM(e.total_potential_payout)', 'totalPotentialPayout')
            .groupBy('e.event_id')
            .addGroupBy('ev.sport_key')
            .addGroupBy('e.market_key')
            .orderBy('SUM(e.total_potential_payout)', 'DESC')
            .limit(Math.max(1, Math.min(500, Number(limit))));
        if (sportKey)
            qb.andWhere('ev.sport_key = :sportKey', { sportKey });
        if (marketKey)
            qb.andWhere('e.market_key = :marketKey', { marketKey });
        const rows = await qb.getRawMany();
        return rows.map((r) => {
            const stake = Number(r.totalStake ?? 0);
            const payout = Number(r.totalPotentialPayout ?? 0);
            return {
                eventId: r.eventId,
                sportKey: r.sportKey,
                marketKey: r.marketKey,
                userCount: Number(r.userCount ?? 0),
                totalStake: Number(stake.toFixed(2)),
                totalPotentialPayout: Number(payout.toFixed(2)),
                worstCaseLiability: Number((Math.max(0, payout - stake)).toFixed(2)),
            };
        });
    }
    async setQueuePause(minutes) {
        const mins = Math.max(0, Number(minutes));
        if (mins <= 0) {
            this.liveQueuePausedUntil = null;
            return { ok: true, paused: false, pausedUntil: null };
        }
        const until = new Date(Date.now() + mins * 60 * 1000);
        this.liveQueuePausedUntil = until;
        return { ok: true, paused: true, pausedUntil: until.toISOString(), minutes: mins };
    }
    getQueuePauseStatus() {
        return {
            paused: !!this.liveQueuePausedUntil && this.liveQueuePausedUntil.getTime() > Date.now(),
            pausedUntil: this.liveQueuePausedUntil ? this.liveQueuePausedUntil.toISOString() : null,
        };
    }
    async dashboardSummary(hours = 24, limit = 30, sportKey, marketKey) {
        const [queue, risk] = await Promise.all([
            this.queueMetrics(hours),
            this.riskOverview(limit, sportKey, marketKey),
        ]);
        const deadTop = await this.dataSource
            .getRepository(sports_bet_queue_entity_1.SportsBetQueue)
            .createQueryBuilder('q')
            .where('q.status = :status', { status: 'dead' })
            .orderBy('q.updated_at', 'DESC')
            .take(20)
            .getMany();
        return {
            queue,
            queuePause: this.getQueuePauseStatus(),
            risk,
            deadTop,
            generatedAt: new Date().toISOString(),
        };
    }
    async monitorRiskAlerts() {
        const deadRateThreshold = Number(process.env.SPORTS_ALERT_DEAD_RATE ?? 0.2);
        const liabilityThreshold = Number(process.env.SPORTS_ALERT_LIABILITY ?? 100000);
        const autoPauseMinutes = Number(process.env.SPORTS_ALERT_AUTO_PAUSE_MINUTES ?? 5);
        const queue = await this.queueMetrics(1);
        const deadRateTriggered = queue.deadRate >= deadRateThreshold && queue.total > 0;
        if (deadRateTriggered) {
            this.logger.warn(`[RISK ALERT] deadRate=${queue.deadRate} threshold=${deadRateThreshold} total=${queue.total}`);
            if (autoPauseMinutes > 0) {
                await this.setQueuePause(autoPauseMinutes);
                this.logger.warn(`[RISK ALERT] live queue paused for ${autoPauseMinutes} minutes`);
            }
        }
        const risk = await this.riskOverview(20);
        const maxLiability = Math.max(...risk.map((r) => Number(r.worstCaseLiability ?? 0)), 0);
        if (maxLiability >= liabilityThreshold) {
            this.logger.warn(`[RISK ALERT] maxLiability=${maxLiability} threshold=${liabilityThreshold}`);
        }
    }
    async processLiveQueue() {
        const repo = this.dataSource.getRepository(sports_bet_queue_entity_1.SportsBetQueue);
        const due = await repo
            .createQueryBuilder('q')
            .where('q.status = :status', { status: 'pending' })
            .andWhere('q.execute_after <= NOW()')
            .orderBy('q.execute_after', 'ASC')
            .take(20)
            .getMany();
        for (const item of due) {
            try {
                await this.dataSource.transaction(async (manager) => {
                    const locked = await manager.findOne(sports_bet_queue_entity_1.SportsBetQueue, {
                        where: { id: item.id },
                        lock: { mode: 'pessimistic_write' },
                    });
                    if (!locked || locked.status !== 'pending')
                        return;
                    locked.status = 'processing';
                    locked.lastAttemptAt = new Date();
                    locked.attemptCount = Number(locked.attemptCount ?? 0) + 1;
                    await manager.save(sports_bet_queue_entity_1.SportsBetQueue, locked);
                });
                const result = await this.placeSportsBet({
                    userId: item.userId,
                    eventId: item.eventId,
                    marketKey: item.marketKey,
                    selection: item.selection,
                    stake: Number(item.stake),
                });
                await this.dataSource.transaction(async (manager) => {
                    const locked = await manager.findOne(sports_bet_queue_entity_1.SportsBetQueue, {
                        where: { id: item.id },
                        lock: { mode: 'pessimistic_write' },
                    });
                    if (!locked)
                        return;
                    if (result?.queued) {
                        const attempts = Number(locked.attemptCount ?? 0);
                        const maxAttempts = Number(locked.maxAttempts ?? this.maxQueueAttempts());
                        if (attempts >= maxAttempts) {
                            locked.status = 'dead';
                            locked.errorMessage = 'max queue attempts reached';
                        }
                        else {
                            locked.status = 'pending';
                            locked.executeAfter = new Date(Date.now() + this.delaySeconds() * 1000);
                            locked.errorMessage = 'still live, re-queued';
                        }
                    }
                    else {
                        locked.status = 'executed';
                        locked.betNo = result?.betNo ?? null;
                        locked.errorMessage = null;
                    }
                    await manager.save(sports_bet_queue_entity_1.SportsBetQueue, locked);
                });
            }
            catch (error) {
                this.logger.warn(`queue process failed id=${item.id}: ${error?.message ?? error}`);
                await this.dataSource.transaction(async (manager) => {
                    const locked = await manager.findOne(sports_bet_queue_entity_1.SportsBetQueue, {
                        where: { id: item.id },
                        lock: { mode: 'pessimistic_write' },
                    });
                    if (!locked)
                        return;
                    const attempts = Number(locked.attemptCount ?? 0);
                    const maxAttempts = Number(locked.maxAttempts ?? this.maxQueueAttempts());
                    locked.status = attempts >= maxAttempts ? 'dead' : 'failed';
                    locked.errorMessage = String(error?.message ?? error).slice(0, 250);
                    locked.lastAttemptAt = new Date();
                    await manager.save(sports_bet_queue_entity_1.SportsBetQueue, locked);
                });
            }
        }
    }
};
exports.BetsService = BetsService;
__decorate([
    (0, schedule_1.Cron)('*/30 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BetsService.prototype, "monitorRiskAlerts", null);
__decorate([
    (0, schedule_1.Cron)('*/3 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BetsService.prototype, "processLiveQueue", null);
exports.BetsService = BetsService = BetsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __param(1, (0, typeorm_1.InjectRepository)(bet_entity_1.Bet)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        provably_fair_service_1.ProvablyFairService,
        odds_service_1.OddsService])
], BetsService);
//# sourceMappingURL=bets.service.js.map
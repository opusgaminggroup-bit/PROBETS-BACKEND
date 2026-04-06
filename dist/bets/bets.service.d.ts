import { DataSource, Repository } from 'typeorm';
import { Bet } from './entities/bet.entity';
import { PlaceBetDto } from './dto/place-bet.dto';
import { SettleBetDto } from './dto/settle-bet.dto';
import { BetResultStatus } from '../common/enums/bet-result-status.enum';
import { PlaceDiceBetDto } from './dto/place-dice-bet.dto';
import { VerifyDiceDto } from './dto/verify-dice.dto';
import { ProvablyFairService } from '../provably-fair/provably-fair.service';
import { PlacePlinkoBetDto } from './dto/place-plinko-bet.dto';
import { VerifyPlinkoDto } from './dto/verify-plinko.dto';
import { PlaceBaccaratBetDto } from './dto/place-baccarat-bet.dto';
import { VerifyBaccaratDto } from './dto/verify-baccarat.dto';
import { OddsService } from '../odds/odds.service';
import { PlaceSportsBetDto } from './dto/place-sports-bet.dto';
import { BetExposure } from './entities/bet-exposure.entity';
import { SportsBetQueue } from './entities/sports-bet-queue.entity';
export declare class BetsService {
    private readonly dataSource;
    private readonly betRepo;
    private readonly fairService;
    private readonly oddsService;
    private readonly logger;
    private liveQueuePausedUntil;
    constructor(dataSource: DataSource, betRepo: Repository<Bet>, fairService: ProvablyFairService, oddsService: OddsService);
    private getOrCreateSeedState;
    rotateSeed(userId: string): Promise<{
        ok: boolean;
        revealedServerSeed: string;
        revealedServerSeedHash: string;
        nextServerSeedHash: string;
    }>;
    getCurrentServerSeedHash(userId: string): Promise<{
        userId: string;
        serverSeedHash: string;
        nextNonce: number;
    }>;
    verifyDice(dto: VerifyDiceDto): {
        verified: boolean;
        calculatedRoll: number;
        serverSeedHash: string;
    };
    verifyPlinko(dto: VerifyPlinkoDto): {
        verified: boolean;
        calculatedPath: number[];
        calculatedSlot: number;
        calculatedMultiplier: number;
        serverSeedHash: string;
    };
    verifyBaccarat(dto: VerifyBaccaratDto): {
        verified: boolean;
        calculated: {
            cards: number[];
            playerScore: number;
            bankerScore: number;
            winner: "player" | "banker" | "tie";
        };
        serverSeedHash: string;
    };
    placeDiceBet(dto: PlaceDiceBetDto): Promise<{
        ok: boolean;
        game: string;
        betNo: string;
        roll: number;
        win: boolean;
        payout: number;
        target: number;
        isUnder: boolean;
        serverSeedHash: string;
        clientSeed: string;
        nonce: number;
        balanceBefore: number;
        balanceAfter: number;
    }>;
    placePlinkoBet(dto: PlacePlinkoBetDto): Promise<{
        ok: boolean;
        game: string;
        betNo: string;
        path: number[];
        slot: number;
        rows: number;
        risk: "low" | "medium" | "high";
        multiplier: number;
        payout: number;
        serverSeedHash: string;
        clientSeed: string;
        nonce: number;
        balanceBefore: number;
        balanceAfter: number;
    }>;
    placeBaccaratBet(dto: PlaceBaccaratBetDto): Promise<{
        ok: boolean;
        game: string;
        betNo: string;
        betOn: "player" | "banker" | "tie";
        winner: "player" | "banker" | "tie";
        playerScore: number;
        bankerScore: number;
        cards: number[];
        multiplier: number;
        payout: number;
        serverSeedHash: string;
        clientSeed: string;
        nonce: number;
        balanceBefore: number;
        balanceAfter: number;
    }>;
    private maxStakePerBet;
    private maxExposurePerUserEventMarket;
    private delaySeconds;
    private queueEnabled;
    private maxQueueAttempts;
    private marginPct;
    private applyMargin;
    private isLiveEvent;
    private allowedBookmakers;
    private oddsPickMode;
    private findSelectionOddsFromEvent;
    placeSportsBet(dto: PlaceSportsBetDto): Promise<{
        ok: boolean;
        queued: boolean;
        queueId: string;
        executeAfter: Date;
        reason: string;
        betNo?: undefined;
        eventId?: undefined;
        marketKey?: undefined;
        selection?: undefined;
        odds?: undefined;
        bookmaker?: undefined;
        potentialPayout?: undefined;
        exposureStake?: undefined;
        exposurePotentialPayout?: undefined;
        balanceBefore?: undefined;
        balanceAfter?: undefined;
    } | {
        ok: boolean;
        betNo: string;
        eventId: string;
        marketKey: string;
        selection: string;
        odds: number;
        bookmaker: string;
        potentialPayout: number;
        exposureStake: number;
        exposurePotentialPayout: number;
        balanceBefore: number;
        balanceAfter: number;
        queued?: undefined;
        queueId?: undefined;
        executeAfter?: undefined;
        reason?: undefined;
    }>;
    placeBet(dto: PlaceBetDto): Promise<{
        ok: boolean;
        betNo: string;
        balanceBefore: number;
        balanceAfter: number;
    }>;
    settleBet(dto: SettleBetDto): Promise<{
        ok: boolean;
        betNo: string;
        result: BetResultStatus.WIN | BetResultStatus.LOSS | BetResultStatus.CANCEL;
        balanceBefore: number;
        balanceAfter: number;
    }>;
    listRecent(userId?: string): Promise<Bet[]>;
    getExposure(userId: string, eventId?: string, marketKey?: string): Promise<BetExposure[]>;
    listQueue(userId?: string, status?: string): Promise<SportsBetQueue[]>;
    retryQueue(queueId: string): Promise<{
        ok: boolean;
        queueId: string;
        status: string;
        executeAfter: Date;
    }>;
    cancelQueue(queueId: string): Promise<{
        ok: boolean;
        queueId: string;
        status: string;
    }>;
    queueMetrics(hours?: number): Promise<{
        windowHours: number;
        total: any;
        byStatus: any[];
        successRate: number;
        deadRate: number;
        failedRate: number;
        avgAttemptsExecuted: number;
    }>;
    riskOverview(limit?: number, sportKey?: string, marketKey?: string): Promise<{
        eventId: any;
        sportKey: any;
        marketKey: any;
        userCount: number;
        totalStake: number;
        totalPotentialPayout: number;
        worstCaseLiability: number;
    }[]>;
    setQueuePause(minutes: number): Promise<{
        ok: boolean;
        paused: boolean;
        pausedUntil: null;
        minutes?: undefined;
    } | {
        ok: boolean;
        paused: boolean;
        pausedUntil: string;
        minutes: number;
    }>;
    getQueuePauseStatus(): {
        paused: boolean;
        pausedUntil: string | null;
    };
    dashboardSummary(hours?: number, limit?: number, sportKey?: string, marketKey?: string): Promise<{
        queue: {
            windowHours: number;
            total: any;
            byStatus: any[];
            successRate: number;
            deadRate: number;
            failedRate: number;
            avgAttemptsExecuted: number;
        };
        queuePause: {
            paused: boolean;
            pausedUntil: string | null;
        };
        risk: {
            eventId: any;
            sportKey: any;
            marketKey: any;
            userCount: number;
            totalStake: number;
            totalPotentialPayout: number;
            worstCaseLiability: number;
        }[];
        deadTop: SportsBetQueue[];
        generatedAt: string;
    }>;
    monitorRiskAlerts(): Promise<void>;
    processLiveQueue(): Promise<void>;
}

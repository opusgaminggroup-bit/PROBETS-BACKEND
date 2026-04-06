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
export declare class BetsController {
    private readonly betsService;
    constructor(betsService: BetsService);
    place(dto: PlaceBetDto): Promise<{
        ok: boolean;
        betNo: string;
        balanceBefore: number;
        balanceAfter: number;
    }>;
    placeSports(dto: PlaceSportsBetDto): Promise<{
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
    placeDice(dto: PlaceDiceBetDto): Promise<{
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
    verifyDice(dto: VerifyDiceDto): {
        verified: boolean;
        calculatedRoll: number;
        serverSeedHash: string;
    };
    placePlinko(dto: PlacePlinkoBetDto): Promise<{
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
    verifyPlinko(dto: VerifyPlinkoDto): {
        verified: boolean;
        calculatedPath: number[];
        calculatedSlot: number;
        calculatedMultiplier: number;
        serverSeedHash: string;
    };
    placeBaccarat(dto: PlaceBaccaratBetDto): Promise<{
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
    getSeedHash(userId: string): Promise<{
        userId: string;
        serverSeedHash: string;
        nextNonce: number;
    }>;
    rotateSeed(userId: string): Promise<{
        ok: boolean;
        revealedServerSeed: string;
        revealedServerSeedHash: string;
        nextServerSeedHash: string;
    }>;
    settle(dto: SettleBetDto): Promise<{
        ok: boolean;
        betNo: string;
        result: import("../common/enums/bet-result-status.enum").BetResultStatus.WIN | import("../common/enums/bet-result-status.enum").BetResultStatus.LOSS | import("../common/enums/bet-result-status.enum").BetResultStatus.CANCEL;
        balanceBefore: number;
        balanceAfter: number;
    }>;
    recent(userId?: string): Promise<import("./entities/bet.entity").Bet[]>;
    exposure(userId: string, eventId?: string, marketKey?: string): Promise<import("./entities/bet-exposure.entity").BetExposure[]>;
    queue(userId?: string, status?: string): Promise<import("./entities/sports-bet-queue.entity").SportsBetQueue[]>;
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
    queueMetrics(hours?: string): Promise<{
        windowHours: number;
        total: any;
        byStatus: any[];
        successRate: number;
        deadRate: number;
        failedRate: number;
        avgAttemptsExecuted: number;
    }>;
    riskOverview(limit?: string, sportKey?: string, marketKey?: string): Promise<{
        eventId: any;
        sportKey: any;
        marketKey: any;
        userCount: number;
        totalStake: number;
        totalPotentialPayout: number;
        worstCaseLiability: number;
    }[]>;
    dashboard(hours?: string, limit?: string, sportKey?: string, marketKey?: string): Promise<{
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
        deadTop: import("./entities/sports-bet-queue.entity").SportsBetQueue[];
        generatedAt: string;
    }>;
    queuePauseStatus(): {
        paused: boolean;
        pausedUntil: string | null;
    };
    setQueuePause(minutes: string): Promise<{
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
}

import { BetType } from '../../common/enums/bet-type.enum';
import { BetResultStatus } from '../../common/enums/bet-result-status.enum';
import { User } from '../../users/entities/user.entity';
export declare class Bet {
    id: string;
    betNo: string;
    userId: string;
    user: User;
    betType: BetType;
    amount: string;
    eventId: string | null;
    marketKey: string | null;
    selection: string | null;
    potentialPayout: string | null;
    odds: string | null;
    resultStatus: BetResultStatus;
    payout: string;
    serverSeedHash: string | null;
    clientSeed: string | null;
    nonce: number | null;
    fairRoll: string | null;
    fairPathJson: unknown;
    apiSnapshot: unknown;
    createdAt: Date;
    settledAt: Date | null;
}

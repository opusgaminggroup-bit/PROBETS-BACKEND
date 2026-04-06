import { BetResultStatus } from '../../common/enums/bet-result-status.enum';
export declare class SettleBetDto {
    betNo: string;
    result: BetResultStatus.WIN | BetResultStatus.LOSS | BetResultStatus.CANCEL;
    payout?: number;
    operatorId?: string;
}

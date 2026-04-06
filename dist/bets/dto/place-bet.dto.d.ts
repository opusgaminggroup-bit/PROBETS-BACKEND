import { BetType } from '../../common/enums/bet-type.enum';
export declare class PlaceBetDto {
    userId: string;
    betType: BetType;
    amount: number;
    odds?: number;
}

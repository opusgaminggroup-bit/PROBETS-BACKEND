import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { BetResultStatus } from '../../common/enums/bet-result-status.enum';

export class SettleBetDto {
  @IsString()
  betNo: string;

  @IsEnum([BetResultStatus.WIN, BetResultStatus.LOSS, BetResultStatus.CANCEL])
  result: BetResultStatus.WIN | BetResultStatus.LOSS | BetResultStatus.CANCEL;

  @IsOptional()
  @IsNumber()
  @Min(0)
  payout?: number;

  @IsOptional()
  @IsString()
  operatorId?: string;
}

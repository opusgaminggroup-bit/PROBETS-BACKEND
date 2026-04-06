import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { BetType } from '../../common/enums/bet-type.enum';

export class PlaceBetDto {
  @IsString()
  userId: string;

  @IsEnum(BetType)
  betType: BetType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  odds?: number;
}

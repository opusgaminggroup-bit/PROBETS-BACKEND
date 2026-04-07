import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { BetResultStatus } from '../../common/enums/bet-result-status.enum';
import { BetType } from '../../common/enums/bet-type.enum';
import { PaginationQueryDto } from './admin-query.dto';

export class AdminBetsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(BetType)
  betType?: BetType;

  @IsOptional()
  @IsEnum(BetResultStatus)
  resultStatus?: BetResultStatus;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

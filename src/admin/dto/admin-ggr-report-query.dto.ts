import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminGgrReportQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number = 30;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['all', 'sports', 'dice', 'plinko', 'baccarat', 'live_casino'])
  gameType?: 'all' | 'sports' | 'dice' | 'plinko' | 'baccarat' | 'live_casino' = 'all';
}

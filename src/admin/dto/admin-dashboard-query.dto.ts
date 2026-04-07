import { Type } from 'class-transformer';
import { IsOptional, Max, Min } from 'class-validator';

export class AdminDashboardQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(30)
  days?: number = 7;
}

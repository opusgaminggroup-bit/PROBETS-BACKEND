import { IsEnum, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminSportsQueueActionDto {
  @IsEnum(['pause', 'retry', 'cancel'])
  action: 'pause' | 'retry' | 'cancel';

  @IsOptional()
  @IsString()
  queueId?: string;

  @IsOptional()
  @Min(0)
  @Max(120)
  minutes?: number;
}

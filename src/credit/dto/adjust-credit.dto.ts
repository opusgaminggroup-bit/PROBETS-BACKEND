import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AdjustCreditDto {
  @IsString()
  operatorId: string;

  @IsString()
  targetUserId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(['add', 'subtract'])
  action: 'add' | 'subtract';

  @IsOptional()
  @IsString()
  remark?: string;
}

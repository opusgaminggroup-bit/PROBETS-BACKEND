import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AssignCreditDto {
  @IsString()
  operatorId: string;

  @IsString()
  targetUserId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

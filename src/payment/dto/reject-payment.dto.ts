import { IsOptional, IsString } from 'class-validator';

export class RejectPaymentDto {
  @IsString()
  operatorId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

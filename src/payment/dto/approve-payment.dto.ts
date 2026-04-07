import { IsOptional, IsString } from 'class-validator';

export class ApprovePaymentDto {
  @IsString()
  operatorId: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

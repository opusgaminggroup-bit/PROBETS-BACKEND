import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsOptional()
  @IsString()
  siteKey?: string;

  @IsEnum(['deposit', 'withdrawal'])
  type: 'deposit' | 'withdrawal';

  @IsString()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  network?: string;

  @IsOptional()
  @IsString()
  walletAddress?: string;

  @IsOptional()
  meta?: Record<string, any>;
}

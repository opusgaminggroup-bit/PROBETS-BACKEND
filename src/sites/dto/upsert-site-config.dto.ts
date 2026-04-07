import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpsertSiteConfigDto {
  @IsString()
  siteKey: string;

  @IsString()
  siteName: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  paymentProvider?: string;

  @IsOptional()
  @IsString()
  liveCasinoProvider?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  meta?: Record<string, any>;
}

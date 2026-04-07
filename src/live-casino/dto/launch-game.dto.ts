import { IsOptional, IsString } from 'class-validator';

export class LaunchGameDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  siteKey?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

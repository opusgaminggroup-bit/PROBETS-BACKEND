import { IsOptional, IsString } from 'class-validator';

export class OddsQueryDto {
  @IsString()
  sport: string;

  @IsOptional()
  @IsString()
  regions?: string;

  @IsOptional()
  @IsString()
  markets?: string;

  @IsOptional()
  @IsString()
  bookmakers?: string;
}

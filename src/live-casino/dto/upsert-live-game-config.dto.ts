import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertLiveGameConfigDto {
  @IsString()
  provider: string;

  @IsString()
  gameId: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

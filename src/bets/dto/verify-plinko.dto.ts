import { IsArray, IsEnum, IsInt, IsNumber, IsString, Max, Min } from 'class-validator';

export class VerifyPlinkoDto {
  @IsString()
  serverSeed: string;

  @IsString()
  clientSeed: string;

  @IsInt()
  @Min(0)
  nonce: number;

  @IsInt()
  @Min(8)
  @Max(16)
  rows: number;

  @IsEnum(['low', 'medium', 'high'])
  risk: 'low' | 'medium' | 'high';

  @IsArray()
  expectedPath: number[];

  @IsNumber()
  expectedMultiplier: number;
}

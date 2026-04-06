import { IsEnum, IsInt, IsNumber, IsString, Max, Min } from 'class-validator';

export class PlacePlinkoBetDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsInt()
  @Min(8)
  @Max(16)
  rows: number;

  @IsEnum(['low', 'medium', 'high'])
  risk: 'low' | 'medium' | 'high';

  @IsString()
  clientSeed: string;
}

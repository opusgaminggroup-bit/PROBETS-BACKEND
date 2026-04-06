import { IsBoolean, IsNumber, IsString, Max, Min } from 'class-validator';

export class PlaceDiceBetDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNumber()
  @Min(1)
  @Max(98)
  target: number;

  @IsBoolean()
  isUnder: boolean;

  @IsString()
  clientSeed: string;
}

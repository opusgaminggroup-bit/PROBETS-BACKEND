import { IsEnum, IsNumber, IsString, Min } from 'class-validator';

export class PlaceBaccaratBetDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(['player', 'banker', 'tie'])
  betOn: 'player' | 'banker' | 'tie';

  @IsString()
  clientSeed: string;
}

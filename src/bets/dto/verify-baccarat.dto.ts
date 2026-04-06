import { IsEnum, IsInt, IsString, Min } from 'class-validator';

export class VerifyBaccaratDto {
  @IsString()
  serverSeed: string;

  @IsString()
  clientSeed: string;

  @IsInt()
  @Min(0)
  nonce: number;

  @IsInt()
  @Min(0)
  expectedPlayerScore: number;

  @IsInt()
  @Min(0)
  expectedBankerScore: number;

  @IsEnum(['player', 'banker', 'tie'])
  expectedWinner: 'player' | 'banker' | 'tie';
}

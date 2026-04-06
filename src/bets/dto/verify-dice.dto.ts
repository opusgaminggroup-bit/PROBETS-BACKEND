import { IsNumber, IsString, Min } from 'class-validator';

export class VerifyDiceDto {
  @IsString()
  serverSeed: string;

  @IsString()
  clientSeed: string;

  @IsNumber()
  @Min(0)
  nonce: number;

  @IsNumber()
  expectedRoll: number;
}

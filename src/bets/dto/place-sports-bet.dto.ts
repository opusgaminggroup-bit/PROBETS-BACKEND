import { IsNumber, IsString, Min } from 'class-validator';

export class PlaceSportsBetDto {
  @IsString()
  userId: string;

  @IsString()
  eventId: string;

  @IsString()
  marketKey: string;

  @IsString()
  selection: string;

  @IsNumber()
  @Min(0.01)
  stake: number;
}

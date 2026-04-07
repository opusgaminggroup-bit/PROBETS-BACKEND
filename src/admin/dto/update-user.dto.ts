import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Min } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @IsString()
  parentId?: string;
}

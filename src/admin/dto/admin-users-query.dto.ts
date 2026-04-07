import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { Role } from '../../common/enums/role.enum';
import { PaginationQueryDto } from './admin-query.dto';

export class AdminUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minCreditBalance?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxCreditBalance?: number;
}

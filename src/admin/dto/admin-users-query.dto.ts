import { IsEnum, IsOptional, IsString } from 'class-validator';
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
}

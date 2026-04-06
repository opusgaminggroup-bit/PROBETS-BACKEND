import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @IsString()
  @Length(3, 50)
  username: string;

  @IsString()
  @Length(6, 255)
  passwordHash: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  parentId?: string;
}

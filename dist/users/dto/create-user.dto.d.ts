import { Role } from '../../common/enums/role.enum';
export declare class CreateUserDto {
    username: string;
    passwordHash: string;
    role: Role;
    parentId?: string;
}

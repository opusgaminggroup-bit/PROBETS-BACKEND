import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private readonly usersRepo;
    constructor(usersRepo: Repository<User>);
    create(dto: CreateUserDto): Promise<User>;
    findOneOrFail(id: string): Promise<User>;
}

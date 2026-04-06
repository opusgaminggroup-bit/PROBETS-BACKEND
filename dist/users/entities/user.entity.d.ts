import { Role } from '../../common/enums/role.enum';
import { CreditTransaction } from '../../credit/entities/credit-transaction.entity';
import { Bet } from '../../bets/entities/bet.entity';
export declare class User {
    id: string;
    username: string;
    passwordHash: string;
    role: Role;
    parentId: string | null;
    parent: User | null;
    children: User[];
    creditBalance: string;
    creditLimit: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    creditTransactions: CreditTransaction[];
    bets: Bet[];
}

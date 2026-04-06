import { CreditTransactionType } from '../../common/enums/credit-transaction-type.enum';
import { User } from '../../users/entities/user.entity';
export declare class CreditTransaction {
    id: string;
    userId: string;
    user: User;
    amount: string;
    type: CreditTransactionType;
    operatorId: string;
    operator: User;
    referenceId: string | null;
    remark: string | null;
    balanceBefore: string;
    balanceAfter: string;
    createdAt: Date;
}

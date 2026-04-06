import { DataSource, Repository } from 'typeorm';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { AdjustCreditDto } from './dto/adjust-credit.dto';
export declare class CreditService {
    private readonly dataSource;
    private readonly txRepo;
    constructor(dataSource: DataSource, txRepo: Repository<CreditTransaction>);
    adjustCredit(dto: AdjustCreditDto): Promise<{
        ok: boolean;
        targetUserId: string;
        action: "add" | "subtract";
        amount: number;
        balanceBefore: number;
        balanceAfter: number;
    }>;
    listByUser(userId: string): Promise<CreditTransaction[]>;
}

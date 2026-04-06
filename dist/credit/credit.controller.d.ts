import { CreditService } from './credit.service';
import { AdjustCreditDto } from './dto/adjust-credit.dto';
export declare class CreditController {
    private readonly creditService;
    constructor(creditService: CreditService);
    adjust(dto: AdjustCreditDto): Promise<{
        ok: boolean;
        targetUserId: string;
        action: "add" | "subtract";
        amount: number;
        balanceBefore: number;
        balanceAfter: number;
    }>;
    listByUser(userId: string): Promise<import("./entities/credit-transaction.entity").CreditTransaction[]>;
}

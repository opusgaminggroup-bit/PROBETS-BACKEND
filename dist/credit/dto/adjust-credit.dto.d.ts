export declare class AdjustCreditDto {
    operatorId: string;
    targetUserId: string;
    amount: number;
    action: 'add' | 'subtract';
    remark?: string;
}

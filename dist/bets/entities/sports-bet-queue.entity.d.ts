export declare class SportsBetQueue {
    id: string;
    userId: string;
    eventId: string;
    marketKey: string;
    selection: string;
    stake: string;
    status: string;
    executeAfter: Date;
    lastAttemptAt: Date | null;
    attemptCount: number;
    maxAttempts: number;
    idempotencyKey: string | null;
    errorMessage: string | null;
    betNo: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export declare class VerifyPlinkoDto {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    rows: number;
    risk: 'low' | 'medium' | 'high';
    expectedPath: number[];
    expectedMultiplier: number;
}

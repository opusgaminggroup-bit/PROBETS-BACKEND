export declare class VerifyBaccaratFairDto {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    expectedPlayerScore: number;
    expectedBankerScore: number;
    expectedWinner: 'player' | 'banker' | 'tie';
}

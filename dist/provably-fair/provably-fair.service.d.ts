export declare class ProvablyFairService {
    generateServerSeed(): string;
    getServerSeedHash(serverSeed: string): string;
    private hmacHex;
    calculateDiceRoll(serverSeed: string, clientSeed: string, nonce: number): number;
    calculatePlinkoPath(serverSeed: string, clientSeed: string, nonce: number, rows: number): number[];
    getPlinkoSlot(path: number[]): number;
    private pickOrInterpolate;
    getPlinkoMultiplier(rows: number, risk: 'low' | 'medium' | 'high', slot: number): number;
    private cardPoint;
    private drawCards;
    calculateBaccarat(serverSeed: string, clientSeed: string, nonce: number): {
        cards: number[];
        playerScore: number;
        bankerScore: number;
        winner: "player" | "banker" | "tie";
    };
    verifyDice(params: {
        serverSeed: string;
        clientSeed: string;
        nonce: number;
        expectedRoll: number;
    }): {
        verified: boolean;
        calculatedRoll: number;
        serverSeedHash: string;
    };
    verifyPlinko(params: {
        serverSeed: string;
        clientSeed: string;
        nonce: number;
        rows: number;
        risk: 'low' | 'medium' | 'high';
        expectedPath: number[];
        expectedMultiplier: number;
    }): {
        verified: boolean;
        calculatedPath: number[];
        calculatedSlot: number;
        calculatedMultiplier: number;
        serverSeedHash: string;
    };
    verifyBaccarat(params: {
        serverSeed: string;
        clientSeed: string;
        nonce: number;
        expectedPlayerScore: number;
        expectedBankerScore: number;
        expectedWinner: 'player' | 'banker' | 'tie';
    }): {
        verified: boolean;
        calculated: {
            cards: number[];
            playerScore: number;
            bankerScore: number;
            winner: "player" | "banker" | "tie";
        };
        serverSeedHash: string;
    };
}

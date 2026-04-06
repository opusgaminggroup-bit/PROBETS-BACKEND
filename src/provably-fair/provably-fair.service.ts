import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class ProvablyFairService {
  generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  getServerSeedHash(serverSeed: string): string {
    return crypto.createHash('sha256').update(serverSeed).digest('hex');
  }

  private hmacHex(serverSeed: string, payload: string): string {
    return crypto.createHmac('sha256', serverSeed).update(payload).digest('hex');
  }

  calculateDiceRoll(serverSeed: string, clientSeed: string, nonce: number): number {
    const hash = this.hmacHex(serverSeed, `${serverSeed}:${clientSeed}:${nonce}`);

    let num = 0;
    for (let i = 0; i < 5; i++) {
      num = (num << 8) + parseInt(hash.substring(i * 2, i * 2 + 2), 16);
    }

    const roll = (num % 1000000) / 10000;
    return Math.min(99.99, Number(roll.toFixed(2)));
  }

  calculatePlinkoPath(serverSeed: string, clientSeed: string, nonce: number, rows: number): number[] {
    const seedPayload = `${serverSeed}:${clientSeed}:${nonce}:plinko`;

    let hash = this.hmacHex(serverSeed, seedPayload);
    const path: number[] = [];

    for (let i = 0; i < rows; i++) {
      if ((i * 2 + 2) > hash.length) {
        hash = crypto.createHash('sha256').update(hash).digest('hex');
      }
      const idx = (i * 2) % hash.length;
      const byte = parseInt(hash.substring(idx, idx + 2), 16);
      path.push(byte % 2);
    }

    return path;
  }

  getPlinkoSlot(path: number[]): number {
    return path.reduce((sum, v) => sum + v, 0);
  }

  private pickOrInterpolate(table: number[], slot: number, rows: number): number {
    const targetLen = rows + 1;
    if (table.length === targetLen) return table[slot];

    const ratio = slot / rows;
    const srcIdx = ratio * (table.length - 1);
    const lo = Math.floor(srcIdx);
    const hi = Math.min(table.length - 1, lo + 1);
    const t = srcIdx - lo;
    const value = table[lo] * (1 - t) + table[hi] * t;
    return Number(value.toFixed(4));
  }

  getPlinkoMultiplier(rows: number, risk: 'low' | 'medium' | 'high', slot: number): number {
    const tables: Record<'low' | 'medium' | 'high', number[]> = {
      low: [0.5, 0.6, 0.7, 0.85, 1.0, 1.1, 1.2, 1.35, 1.45, 1.35, 1.2, 1.1, 1.0, 0.85, 0.7, 0.6, 0.5],
      medium: [0.2, 0.3, 0.45, 0.7, 0.95, 1.2, 1.5, 2.0, 3.0, 2.0, 1.5, 1.2, 0.95, 0.7, 0.45, 0.3, 0.2],
      high: [0.1, 0.2, 0.3, 0.5, 0.8, 1.2, 2.0, 3.0, 8.0, 3.0, 2.0, 1.2, 0.8, 0.5, 0.3, 0.2, 0.1],
    };

    const table = tables[risk];
    return this.pickOrInterpolate(table, slot, rows);
  }

  // Baccarat: 取6张牌（玩家2张+庄家2张+可能补牌2张），按经典点数法
  // 这里做简化版：先比较两边最终点数，不实现完整第三张补牌规则树。
  // 好处：可验证、可复算、实现快；后续可升级为完整Punto Banco规则。
  private cardPoint(card: number): number {
    const rank = (card % 13) + 1; // 1..13
    if (rank >= 10) return 0;
    return rank;
  }

  private drawCards(serverSeed: string, clientSeed: string, nonce: number, count: number): number[] {
    const payload = `${serverSeed}:${clientSeed}:${nonce}:baccarat`;
    let hash = this.hmacHex(serverSeed, payload);
    const cards: number[] = [];

    for (let i = 0; i < count; i++) {
      if ((i * 2 + 2) > hash.length) {
        hash = crypto.createHash('sha256').update(hash).digest('hex');
      }
      const idx = (i * 2) % hash.length;
      const byte = parseInt(hash.substring(idx, idx + 2), 16);
      cards.push(byte % 52); // 0..51
    }

    return cards;
  }

  calculateBaccarat(serverSeed: string, clientSeed: string, nonce: number) {
    const cards = this.drawCards(serverSeed, clientSeed, nonce, 6);

    const playerScore = (this.cardPoint(cards[0]) + this.cardPoint(cards[1]) + this.cardPoint(cards[4])) % 10;
    const bankerScore = (this.cardPoint(cards[2]) + this.cardPoint(cards[3]) + this.cardPoint(cards[5])) % 10;

    const winner: 'player' | 'banker' | 'tie' =
      playerScore > bankerScore ? 'player' : bankerScore > playerScore ? 'banker' : 'tie';

    return {
      cards,
      playerScore,
      bankerScore,
      winner,
    };
  }

  verifyDice(params: {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    expectedRoll: number;
  }) {
    const roll = this.calculateDiceRoll(params.serverSeed, params.clientSeed, params.nonce);
    return {
      verified: Number(roll.toFixed(2)) === Number(params.expectedRoll.toFixed(2)),
      calculatedRoll: roll,
      serverSeedHash: this.getServerSeedHash(params.serverSeed),
    };
  }

  verifyPlinko(params: {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    rows: number;
    risk: 'low' | 'medium' | 'high';
    expectedPath: number[];
    expectedMultiplier: number;
  }) {
    const path = this.calculatePlinkoPath(params.serverSeed, params.clientSeed, params.nonce, params.rows);
    const slot = this.getPlinkoSlot(path);
    const multiplier = this.getPlinkoMultiplier(params.rows, params.risk, slot);

    const samePath = JSON.stringify(path) === JSON.stringify(params.expectedPath);
    const sameMult = Number(multiplier.toFixed(4)) === Number(params.expectedMultiplier.toFixed(4));

    return {
      verified: samePath && sameMult,
      calculatedPath: path,
      calculatedSlot: slot,
      calculatedMultiplier: multiplier,
      serverSeedHash: this.getServerSeedHash(params.serverSeed),
    };
  }

  verifyBaccarat(params: {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    expectedPlayerScore: number;
    expectedBankerScore: number;
    expectedWinner: 'player' | 'banker' | 'tie';
  }) {
    const r = this.calculateBaccarat(params.serverSeed, params.clientSeed, params.nonce);
    const verified =
      r.playerScore === params.expectedPlayerScore &&
      r.bankerScore === params.expectedBankerScore &&
      r.winner === params.expectedWinner;

    return {
      verified,
      calculated: r,
      serverSeedHash: this.getServerSeedHash(params.serverSeed),
    };
  }
}

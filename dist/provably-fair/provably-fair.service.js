"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvablyFairService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let ProvablyFairService = class ProvablyFairService {
    generateServerSeed() {
        return crypto.randomBytes(32).toString('hex');
    }
    getServerSeedHash(serverSeed) {
        return crypto.createHash('sha256').update(serverSeed).digest('hex');
    }
    hmacHex(serverSeed, payload) {
        return crypto.createHmac('sha256', serverSeed).update(payload).digest('hex');
    }
    calculateDiceRoll(serverSeed, clientSeed, nonce) {
        const hash = this.hmacHex(serverSeed, `${serverSeed}:${clientSeed}:${nonce}`);
        let num = 0;
        for (let i = 0; i < 5; i++) {
            num = (num << 8) + parseInt(hash.substring(i * 2, i * 2 + 2), 16);
        }
        const roll = (num % 1000000) / 10000;
        return Math.min(99.99, Number(roll.toFixed(2)));
    }
    calculatePlinkoPath(serverSeed, clientSeed, nonce, rows) {
        const seedPayload = `${serverSeed}:${clientSeed}:${nonce}:plinko`;
        let hash = this.hmacHex(serverSeed, seedPayload);
        const path = [];
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
    getPlinkoSlot(path) {
        return path.reduce((sum, v) => sum + v, 0);
    }
    pickOrInterpolate(table, slot, rows) {
        const targetLen = rows + 1;
        if (table.length === targetLen)
            return table[slot];
        const ratio = slot / rows;
        const srcIdx = ratio * (table.length - 1);
        const lo = Math.floor(srcIdx);
        const hi = Math.min(table.length - 1, lo + 1);
        const t = srcIdx - lo;
        const value = table[lo] * (1 - t) + table[hi] * t;
        return Number(value.toFixed(4));
    }
    getPlinkoMultiplier(rows, risk, slot) {
        const tables = {
            low: [0.5, 0.6, 0.7, 0.85, 1.0, 1.1, 1.2, 1.35, 1.45, 1.35, 1.2, 1.1, 1.0, 0.85, 0.7, 0.6, 0.5],
            medium: [0.2, 0.3, 0.45, 0.7, 0.95, 1.2, 1.5, 2.0, 3.0, 2.0, 1.5, 1.2, 0.95, 0.7, 0.45, 0.3, 0.2],
            high: [0.1, 0.2, 0.3, 0.5, 0.8, 1.2, 2.0, 3.0, 8.0, 3.0, 2.0, 1.2, 0.8, 0.5, 0.3, 0.2, 0.1],
        };
        const table = tables[risk];
        return this.pickOrInterpolate(table, slot, rows);
    }
    cardPoint(card) {
        const rank = (card % 13) + 1;
        if (rank >= 10)
            return 0;
        return rank;
    }
    drawCards(serverSeed, clientSeed, nonce, count) {
        const payload = `${serverSeed}:${clientSeed}:${nonce}:baccarat`;
        let hash = this.hmacHex(serverSeed, payload);
        const cards = [];
        for (let i = 0; i < count; i++) {
            if ((i * 2 + 2) > hash.length) {
                hash = crypto.createHash('sha256').update(hash).digest('hex');
            }
            const idx = (i * 2) % hash.length;
            const byte = parseInt(hash.substring(idx, idx + 2), 16);
            cards.push(byte % 52);
        }
        return cards;
    }
    calculateBaccarat(serverSeed, clientSeed, nonce) {
        const cards = this.drawCards(serverSeed, clientSeed, nonce, 6);
        const playerScore = (this.cardPoint(cards[0]) + this.cardPoint(cards[1]) + this.cardPoint(cards[4])) % 10;
        const bankerScore = (this.cardPoint(cards[2]) + this.cardPoint(cards[3]) + this.cardPoint(cards[5])) % 10;
        const winner = playerScore > bankerScore ? 'player' : bankerScore > playerScore ? 'banker' : 'tie';
        return {
            cards,
            playerScore,
            bankerScore,
            winner,
        };
    }
    verifyDice(params) {
        const roll = this.calculateDiceRoll(params.serverSeed, params.clientSeed, params.nonce);
        return {
            verified: Number(roll.toFixed(2)) === Number(params.expectedRoll.toFixed(2)),
            calculatedRoll: roll,
            serverSeedHash: this.getServerSeedHash(params.serverSeed),
        };
    }
    verifyPlinko(params) {
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
    verifyBaccarat(params) {
        const r = this.calculateBaccarat(params.serverSeed, params.clientSeed, params.nonce);
        const verified = r.playerScore === params.expectedPlayerScore &&
            r.bankerScore === params.expectedBankerScore &&
            r.winner === params.expectedWinner;
        return {
            verified,
            calculated: r,
            serverSeedHash: this.getServerSeedHash(params.serverSeed),
        };
    }
};
exports.ProvablyFairService = ProvablyFairService;
exports.ProvablyFairService = ProvablyFairService = __decorate([
    (0, common_1.Injectable)()
], ProvablyFairService);
//# sourceMappingURL=provably-fair.service.js.map
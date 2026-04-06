"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bet = void 0;
const typeorm_1 = require("typeorm");
const bet_type_enum_1 = require("../../common/enums/bet-type.enum");
const bet_result_status_enum_1 = require("../../common/enums/bet-result-status.enum");
const user_entity_1 = require("../../users/entities/user.entity");
let Bet = class Bet {
    id;
    betNo;
    userId;
    user;
    betType;
    amount;
    eventId;
    marketKey;
    selection;
    potentialPayout;
    odds;
    resultStatus;
    payout;
    serverSeedHash;
    clientSeed;
    nonce;
    fairRoll;
    fairPathJson;
    apiSnapshot;
    createdAt;
    settledAt;
};
exports.Bet = Bet;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], Bet.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bet_no', type: 'varchar', length: 64, unique: true }),
    __metadata("design:type", String)
], Bet.prototype, "betNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], Bet.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.bets, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Bet.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bet_type', type: 'enum', enum: bet_type_enum_1.BetType }),
    __metadata("design:type", String)
], Bet.prototype, "betType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 20, scale: 2 }),
    __metadata("design:type", String)
], Bet.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_id', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Bet.prototype, "eventId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'market_key', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Bet.prototype, "marketKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Bet.prototype, "selection", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'potential_payout', type: 'decimal', precision: 20, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Bet.prototype, "potentialPayout", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], Bet.prototype, "odds", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'result_status', type: 'enum', enum: bet_result_status_enum_1.BetResultStatus, default: bet_result_status_enum_1.BetResultStatus.PENDING }),
    __metadata("design:type", String)
], Bet.prototype, "resultStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 20, scale: 2, default: 0 }),
    __metadata("design:type", String)
], Bet.prototype, "payout", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'server_seed_hash', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], Bet.prototype, "serverSeedHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_seed', type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], Bet.prototype, "clientSeed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Bet.prototype, "nonce", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fair_roll', type: 'decimal', precision: 6, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Bet.prototype, "fairRoll", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fair_path_json', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Bet.prototype, "fairPathJson", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'api_snapshot', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Bet.prototype, "apiSnapshot", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'datetime' }),
    __metadata("design:type", Date)
], Bet.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'settled_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], Bet.prototype, "settledAt", void 0);
exports.Bet = Bet = __decorate([
    (0, typeorm_1.Entity)('bets')
], Bet);
//# sourceMappingURL=bet.entity.js.map
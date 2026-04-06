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
exports.BetExposure = void 0;
const typeorm_1 = require("typeorm");
let BetExposure = class BetExposure {
    id;
    eventId;
    marketKey;
    userId;
    totalStake;
    totalPotentialPayout;
    createdAt;
    updatedAt;
};
exports.BetExposure = BetExposure;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], BetExposure.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_bet_exposure_event_market'),
    (0, typeorm_1.Column)({ name: 'event_id', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], BetExposure.prototype, "eventId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'market_key', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], BetExposure.prototype, "marketKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], BetExposure.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_stake', type: 'decimal', precision: 20, scale: 2, default: 0 }),
    __metadata("design:type", String)
], BetExposure.prototype, "totalStake", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_potential_payout', type: 'decimal', precision: 20, scale: 2, default: 0 }),
    __metadata("design:type", String)
], BetExposure.prototype, "totalPotentialPayout", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'datetime' }),
    __metadata("design:type", Date)
], BetExposure.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'datetime' }),
    __metadata("design:type", Date)
], BetExposure.prototype, "updatedAt", void 0);
exports.BetExposure = BetExposure = __decorate([
    (0, typeorm_1.Entity)('bet_exposures'),
    (0, typeorm_1.Unique)('uq_bet_exposure_user_event_market', ['userId', 'eventId', 'marketKey'])
], BetExposure);
//# sourceMappingURL=bet-exposure.entity.js.map
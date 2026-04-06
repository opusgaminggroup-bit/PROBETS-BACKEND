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
exports.SportsBetQueue = void 0;
const typeorm_1 = require("typeorm");
let SportsBetQueue = class SportsBetQueue {
    id;
    userId;
    eventId;
    marketKey;
    selection;
    stake;
    status;
    executeAfter;
    lastAttemptAt;
    attemptCount;
    maxAttempts;
    idempotencyKey;
    errorMessage;
    betNo;
    createdAt;
    updatedAt;
};
exports.SportsBetQueue = SportsBetQueue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], SportsBetQueue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], SportsBetQueue.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sports_queue_event_market'),
    (0, typeorm_1.Column)({ name: 'event_id', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], SportsBetQueue.prototype, "eventId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'market_key', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], SportsBetQueue.prototype, "marketKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], SportsBetQueue.prototype, "selection", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 20, scale: 2 }),
    __metadata("design:type", String)
], SportsBetQueue.prototype, "stake", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sports_queue_status_exec'),
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'pending' }),
    __metadata("design:type", String)
], SportsBetQueue.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'execute_after', type: 'datetime' }),
    __metadata("design:type", Date)
], SportsBetQueue.prototype, "executeAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_attempt_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], SportsBetQueue.prototype, "lastAttemptAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'attempt_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SportsBetQueue.prototype, "attemptCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_attempts', type: 'int', default: 10 }),
    __metadata("design:type", Number)
], SportsBetQueue.prototype, "maxAttempts", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sports_queue_idempotency'),
    (0, typeorm_1.Column)({ name: 'idempotency_key', type: 'varchar', length: 180, nullable: true }),
    __metadata("design:type", Object)
], SportsBetQueue.prototype, "idempotencyKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], SportsBetQueue.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bet_no', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], SportsBetQueue.prototype, "betNo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'datetime' }),
    __metadata("design:type", Date)
], SportsBetQueue.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'datetime' }),
    __metadata("design:type", Date)
], SportsBetQueue.prototype, "updatedAt", void 0);
exports.SportsBetQueue = SportsBetQueue = __decorate([
    (0, typeorm_1.Entity)('sports_bet_queue')
], SportsBetQueue);
//# sourceMappingURL=sports-bet-queue.entity.js.map
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
exports.EventEntity = void 0;
const typeorm_1 = require("typeorm");
const event_status_enum_1 = require("../../common/enums/event-status.enum");
let EventEntity = class EventEntity {
    eventId;
    sportKey;
    homeTeam;
    awayTeam;
    commenceTime;
    lastUpdated;
    status;
    bookmakersJson;
    createdAt;
    updatedAt;
};
exports.EventEntity = EventEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'event_id', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], EventEntity.prototype, "eventId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sport_key', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], EventEntity.prototype, "sportKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'home_team', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], EventEntity.prototype, "homeTeam", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'away_team', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], EventEntity.prototype, "awayTeam", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'commence_time', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], EventEntity.prototype, "commenceTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_updated', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], EventEntity.prototype, "lastUpdated", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: event_status_enum_1.EventStatus, default: event_status_enum_1.EventStatus.UPCOMING }),
    __metadata("design:type", String)
], EventEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bookmakers_json', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], EventEntity.prototype, "bookmakersJson", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'datetime' }),
    __metadata("design:type", Date)
], EventEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'datetime' }),
    __metadata("design:type", Date)
], EventEntity.prototype, "updatedAt", void 0);
exports.EventEntity = EventEntity = __decorate([
    (0, typeorm_1.Entity)('events')
], EventEntity);
//# sourceMappingURL=event.entity.js.map
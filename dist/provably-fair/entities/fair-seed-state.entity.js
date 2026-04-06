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
exports.FairSeedState = void 0;
const typeorm_1 = require("typeorm");
let FairSeedState = class FairSeedState {
    id;
    userId;
    currentServerSeed;
    currentServerSeedHash;
    nonce;
    lastRevealedServerSeed;
    lastRevealedServerSeedHash;
    updatedAt;
};
exports.FairSeedState = FairSeedState;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], FairSeedState.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'bigint', unsigned: true, unique: true }),
    __metadata("design:type", String)
], FairSeedState.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_server_seed', type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], FairSeedState.prototype, "currentServerSeed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_server_seed_hash', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], FairSeedState.prototype, "currentServerSeedHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], FairSeedState.prototype, "nonce", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_revealed_server_seed', type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], FairSeedState.prototype, "lastRevealedServerSeed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_revealed_server_seed_hash', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], FairSeedState.prototype, "lastRevealedServerSeedHash", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'datetime' }),
    __metadata("design:type", Date)
], FairSeedState.prototype, "updatedAt", void 0);
exports.FairSeedState = FairSeedState = __decorate([
    (0, typeorm_1.Entity)('fair_seed_states')
], FairSeedState);
//# sourceMappingURL=fair-seed-state.entity.js.map
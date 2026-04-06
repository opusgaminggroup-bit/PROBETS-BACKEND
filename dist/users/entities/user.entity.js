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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const role_enum_1 = require("../../common/enums/role.enum");
const credit_transaction_entity_1 = require("../../credit/entities/credit-transaction.entity");
const bet_entity_1 = require("../../bets/entities/bet.entity");
let User = class User {
    id;
    username;
    passwordHash;
    role;
    parentId;
    parent;
    children;
    creditBalance;
    creditLimit;
    isActive;
    createdAt;
    updatedAt;
    creditTransactions;
    bets;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_hash', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: role_enum_1.Role, default: role_enum_1.Role.PLAYER }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", Object)
], User.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => User, (u) => u.parent),
    __metadata("design:type", Array)
], User.prototype, "children", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credit_balance', type: 'decimal', precision: 20, scale: 2, default: 0 }),
    __metadata("design:type", String)
], User.prototype, "creditBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credit_limit', type: 'decimal', precision: 20, scale: 2, default: 0 }),
    __metadata("design:type", String)
], User.prototype, "creditLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'tinyint', width: 1, default: () => '1' }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'datetime' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'datetime' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => credit_transaction_entity_1.CreditTransaction, (tx) => tx.user),
    __metadata("design:type", Array)
], User.prototype, "creditTransactions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bet_entity_1.Bet, (bet) => bet.user),
    __metadata("design:type", Array)
], User.prototype, "bets", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map
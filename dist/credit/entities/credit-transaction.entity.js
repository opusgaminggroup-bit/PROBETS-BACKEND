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
exports.CreditTransaction = void 0;
const typeorm_1 = require("typeorm");
const credit_transaction_type_enum_1 = require("../../common/enums/credit-transaction-type.enum");
const user_entity_1 = require("../../users/entities/user.entity");
let CreditTransaction = class CreditTransaction {
    id;
    userId;
    user;
    amount;
    type;
    operatorId;
    operator;
    referenceId;
    remark;
    balanceBefore;
    balanceAfter;
    createdAt;
};
exports.CreditTransaction = CreditTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.creditTransactions, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], CreditTransaction.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 20, scale: 2 }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: credit_transaction_type_enum_1.CreditTransactionType }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'operator_id', type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "operatorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'operator_id' }),
    __metadata("design:type", user_entity_1.User)
], CreditTransaction.prototype, "operator", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_id', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], CreditTransaction.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], CreditTransaction.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'balance_before', type: 'decimal', precision: 20, scale: 2 }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "balanceBefore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'balance_after', type: 'decimal', precision: 20, scale: 2 }),
    __metadata("design:type", String)
], CreditTransaction.prototype, "balanceAfter", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'datetime' }),
    __metadata("design:type", Date)
], CreditTransaction.prototype, "createdAt", void 0);
exports.CreditTransaction = CreditTransaction = __decorate([
    (0, typeorm_1.Entity)('credit_transactions')
], CreditTransaction);
//# sourceMappingURL=credit-transaction.entity.js.map
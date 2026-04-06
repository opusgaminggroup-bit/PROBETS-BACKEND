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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const credit_transaction_entity_1 = require("./entities/credit-transaction.entity");
const credit_transaction_type_enum_1 = require("../common/enums/credit-transaction-type.enum");
let CreditService = class CreditService {
    dataSource;
    txRepo;
    constructor(dataSource, txRepo) {
        this.dataSource = dataSource;
        this.txRepo = txRepo;
    }
    async adjustCredit(dto) {
        return this.dataSource.transaction(async (manager) => {
            const operator = await manager.findOne(user_entity_1.User, {
                where: { id: dto.operatorId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!operator)
                throw new common_1.NotFoundException('Operator not found');
            const target = await manager.findOne(user_entity_1.User, {
                where: { id: dto.targetUserId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!target)
                throw new common_1.NotFoundException('Target user not found');
            if (target.parentId !== operator.id) {
                throw new common_1.ForbiddenException('Only direct upline can adjust this user credit');
            }
            const before = Number(target.creditBalance);
            const amount = Number(dto.amount);
            const delta = dto.action === 'add' ? amount : -amount;
            const after = before + delta;
            if (after < 0)
                throw new common_1.BadRequestException('Insufficient credit');
            target.creditBalance = after.toFixed(2);
            await manager.save(user_entity_1.User, target);
            const tx = manager.create(credit_transaction_entity_1.CreditTransaction, {
                userId: target.id,
                operatorId: operator.id,
                amount: delta.toFixed(2),
                type: dto.action === 'add'
                    ? credit_transaction_type_enum_1.CreditTransactionType.ADD_CREDIT
                    : credit_transaction_type_enum_1.CreditTransactionType.SUBTRACT_CREDIT,
                remark: dto.remark ?? null,
                referenceId: null,
                balanceBefore: before.toFixed(2),
                balanceAfter: after.toFixed(2),
            });
            await manager.save(credit_transaction_entity_1.CreditTransaction, tx);
            return {
                ok: true,
                targetUserId: target.id,
                action: dto.action,
                amount,
                balanceBefore: before,
                balanceAfter: after,
            };
        });
    }
    listByUser(userId) {
        return this.txRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 100,
        });
    }
};
exports.CreditService = CreditService;
exports.CreditService = CreditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __param(1, (0, typeorm_1.InjectRepository)(credit_transaction_entity_1.CreditTransaction)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository])
], CreditService);
//# sourceMappingURL=credit.service.js.map
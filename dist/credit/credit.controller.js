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
exports.CreditController = void 0;
const common_1 = require("@nestjs/common");
const credit_service_1 = require("./credit.service");
const adjust_credit_dto_1 = require("./dto/adjust-credit.dto");
let CreditController = class CreditController {
    creditService;
    constructor(creditService) {
        this.creditService = creditService;
    }
    adjust(dto) {
        return this.creditService.adjustCredit(dto);
    }
    listByUser(userId) {
        return this.creditService.listByUser(userId);
    }
};
exports.CreditController = CreditController;
__decorate([
    (0, common_1.Post)('adjust'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [adjust_credit_dto_1.AdjustCreditDto]),
    __metadata("design:returntype", void 0)
], CreditController.prototype, "adjust", null);
__decorate([
    (0, common_1.Get)('transactions/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CreditController.prototype, "listByUser", null);
exports.CreditController = CreditController = __decorate([
    (0, common_1.Controller)('credit'),
    __metadata("design:paramtypes", [credit_service_1.CreditService])
], CreditController);
//# sourceMappingURL=credit.controller.js.map
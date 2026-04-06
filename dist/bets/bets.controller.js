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
exports.BetsController = void 0;
const common_1 = require("@nestjs/common");
const bets_service_1 = require("./bets.service");
const place_bet_dto_1 = require("./dto/place-bet.dto");
const settle_bet_dto_1 = require("./dto/settle-bet.dto");
const place_dice_bet_dto_1 = require("./dto/place-dice-bet.dto");
const verify_dice_dto_1 = require("./dto/verify-dice.dto");
const place_plinko_bet_dto_1 = require("./dto/place-plinko-bet.dto");
const verify_plinko_dto_1 = require("./dto/verify-plinko.dto");
const place_baccarat_bet_dto_1 = require("./dto/place-baccarat-bet.dto");
const verify_baccarat_dto_1 = require("./dto/verify-baccarat.dto");
const place_sports_bet_dto_1 = require("./dto/place-sports-bet.dto");
let BetsController = class BetsController {
    betsService;
    constructor(betsService) {
        this.betsService = betsService;
    }
    place(dto) {
        return this.betsService.placeBet(dto);
    }
    placeSports(dto) {
        return this.betsService.placeSportsBet(dto);
    }
    placeDice(dto) {
        return this.betsService.placeDiceBet(dto);
    }
    verifyDice(dto) {
        return this.betsService.verifyDice(dto);
    }
    placePlinko(dto) {
        return this.betsService.placePlinkoBet(dto);
    }
    verifyPlinko(dto) {
        return this.betsService.verifyPlinko(dto);
    }
    placeBaccarat(dto) {
        return this.betsService.placeBaccaratBet(dto);
    }
    verifyBaccarat(dto) {
        return this.betsService.verifyBaccarat(dto);
    }
    getSeedHash(userId) {
        return this.betsService.getCurrentServerSeedHash(userId);
    }
    rotateSeed(userId) {
        return this.betsService.rotateSeed(userId);
    }
    settle(dto) {
        return this.betsService.settleBet(dto);
    }
    recent(userId) {
        return this.betsService.listRecent(userId);
    }
    exposure(userId, eventId, marketKey) {
        return this.betsService.getExposure(userId, eventId, marketKey);
    }
    queue(userId, status) {
        return this.betsService.listQueue(userId, status);
    }
    retryQueue(queueId) {
        return this.betsService.retryQueue(queueId);
    }
    cancelQueue(queueId) {
        return this.betsService.cancelQueue(queueId);
    }
    queueMetrics(hours) {
        return this.betsService.queueMetrics(Number(hours ?? 24));
    }
    riskOverview(limit, sportKey, marketKey) {
        return this.betsService.riskOverview(Number(limit ?? 50), sportKey, marketKey);
    }
    dashboard(hours, limit, sportKey, marketKey) {
        return this.betsService.dashboardSummary(Number(hours ?? 24), Number(limit ?? 30), sportKey, marketKey);
    }
    queuePauseStatus() {
        return this.betsService.getQueuePauseStatus();
    }
    setQueuePause(minutes) {
        return this.betsService.setQueuePause(Number(minutes));
    }
};
exports.BetsController = BetsController;
__decorate([
    (0, common_1.Post)('place'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [place_bet_dto_1.PlaceBetDto]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "place", null);
__decorate([
    (0, common_1.Post)('sports/place'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [place_sports_bet_dto_1.PlaceSportsBetDto]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "placeSports", null);
__decorate([
    (0, common_1.Post)('dice/place'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [place_dice_bet_dto_1.PlaceDiceBetDto]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "placeDice", null);
__decorate([
    (0, common_1.Post)('dice/verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_dice_dto_1.VerifyDiceDto]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "verifyDice", null);
__decorate([
    (0, common_1.Post)('plinko/place'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [place_plinko_bet_dto_1.PlacePlinkoBetDto]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "placePlinko", null);
__decorate([
    (0, common_1.Post)('plinko/verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_plinko_dto_1.VerifyPlinkoDto]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "verifyPlinko", null);
__decorate([
    (0, common_1.Post)('baccarat/place'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [place_baccarat_bet_dto_1.PlaceBaccaratBetDto]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "placeBaccarat", null);
__decorate([
    (0, common_1.Post)('baccarat/verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_baccarat_dto_1.VerifyBaccaratDto]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "verifyBaccarat", null);
__decorate([
    (0, common_1.Get)('fairness/:userId/hash'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "getSeedHash", null);
__decorate([
    (0, common_1.Post)('fairness/:userId/rotate-seed'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "rotateSeed", null);
__decorate([
    (0, common_1.Post)('settle'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settle_bet_dto_1.SettleBetDto]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "settle", null);
__decorate([
    (0, common_1.Get)('recent'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "recent", null);
__decorate([
    (0, common_1.Get)('risk/exposure'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('eventId')),
    __param(2, (0, common_1.Query)('marketKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "exposure", null);
__decorate([
    (0, common_1.Get)('sports/queue'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "queue", null);
__decorate([
    (0, common_1.Post)('sports/queue/:queueId/retry'),
    __param(0, (0, common_1.Param)('queueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "retryQueue", null);
__decorate([
    (0, common_1.Post)('sports/queue/:queueId/cancel'),
    __param(0, (0, common_1.Param)('queueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "cancelQueue", null);
__decorate([
    (0, common_1.Get)('sports/queue/metrics'),
    __param(0, (0, common_1.Query)('hours')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "queueMetrics", null);
__decorate([
    (0, common_1.Get)('risk/overview'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('sportKey')),
    __param(2, (0, common_1.Query)('marketKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "riskOverview", null);
__decorate([
    (0, common_1.Get)('ops/dashboard'),
    __param(0, (0, common_1.Query)('hours')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('sportKey')),
    __param(3, (0, common_1.Query)('marketKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('ops/queue-pause'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "queuePauseStatus", null);
__decorate([
    (0, common_1.Post)('ops/queue-pause/:minutes'),
    __param(0, (0, common_1.Param)('minutes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BetsController.prototype, "setQueuePause", null);
exports.BetsController = BetsController = __decorate([
    (0, common_1.Controller)('bets'),
    __metadata("design:paramtypes", [bets_service_1.BetsService])
], BetsController);
//# sourceMappingURL=bets.controller.js.map
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
exports.OddsController = void 0;
const common_1 = require("@nestjs/common");
const odds_service_1 = require("./odds.service");
const odds_query_dto_1 = require("./dto/odds-query.dto");
let OddsController = class OddsController {
    oddsService;
    constructor(oddsService) {
        this.oddsService = oddsService;
    }
    sports() {
        return this.oddsService.getSports();
    }
    markets(query) {
        return this.oddsService.getOdds(query);
    }
    refresh(query) {
        return this.oddsService.refreshSportOdds(query);
    }
};
exports.OddsController = OddsController;
__decorate([
    (0, common_1.Get)('sports'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OddsController.prototype, "sports", null);
__decorate([
    (0, common_1.Get)('markets'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [odds_query_dto_1.OddsQueryDto]),
    __metadata("design:returntype", void 0)
], OddsController.prototype, "markets", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [odds_query_dto_1.OddsQueryDto]),
    __metadata("design:returntype", void 0)
], OddsController.prototype, "refresh", null);
exports.OddsController = OddsController = __decorate([
    (0, common_1.Controller)('odds'),
    __metadata("design:paramtypes", [odds_service_1.OddsService])
], OddsController);
//# sourceMappingURL=odds.controller.js.map
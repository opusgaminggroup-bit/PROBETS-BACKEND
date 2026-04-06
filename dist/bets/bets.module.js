"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bet_entity_1 = require("./entities/bet.entity");
const bet_exposure_entity_1 = require("./entities/bet-exposure.entity");
const sports_bet_queue_entity_1 = require("./entities/sports-bet-queue.entity");
const user_entity_1 = require("../users/entities/user.entity");
const credit_transaction_entity_1 = require("../credit/entities/credit-transaction.entity");
const bets_controller_1 = require("./bets.controller");
const bets_service_1 = require("./bets.service");
const provably_fair_module_1 = require("../provably-fair/provably-fair.module");
const fair_seed_state_entity_1 = require("../provably-fair/entities/fair-seed-state.entity");
const odds_module_1 = require("../odds/odds.module");
const sports_settlement_service_1 = require("./sports-settlement.service");
let BetsModule = class BetsModule {
};
exports.BetsModule = BetsModule;
exports.BetsModule = BetsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                bet_entity_1.Bet,
                bet_exposure_entity_1.BetExposure,
                sports_bet_queue_entity_1.SportsBetQueue,
                user_entity_1.User,
                credit_transaction_entity_1.CreditTransaction,
                fair_seed_state_entity_1.FairSeedState,
            ]),
            provably_fair_module_1.ProvablyFairModule,
            odds_module_1.OddsModule,
        ],
        controllers: [bets_controller_1.BetsController],
        providers: [bets_service_1.BetsService, sports_settlement_service_1.SportsSettlementService],
        exports: [bets_service_1.BetsService],
    })
], BetsModule);
//# sourceMappingURL=bets.module.js.map
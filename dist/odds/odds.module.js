"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OddsModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const typeorm_1 = require("@nestjs/typeorm");
const odds_service_1 = require("./odds.service");
const odds_controller_1 = require("./odds.controller");
const event_entity_1 = require("../events/entities/event.entity");
const odds_sync_service_1 = require("./odds-sync.service");
let OddsModule = class OddsModule {
};
exports.OddsModule = OddsModule;
exports.OddsModule = OddsModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule, typeorm_1.TypeOrmModule.forFeature([event_entity_1.EventEntity])],
        controllers: [odds_controller_1.OddsController],
        providers: [odds_service_1.OddsService, odds_sync_service_1.OddsSyncService],
        exports: [odds_service_1.OddsService, typeorm_1.TypeOrmModule],
    })
], OddsModule);
//# sourceMappingURL=odds.module.js.map
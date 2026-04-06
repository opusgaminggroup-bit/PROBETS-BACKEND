"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvablyFairModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const provably_fair_service_1 = require("./provably-fair.service");
const fair_seed_state_entity_1 = require("./entities/fair-seed-state.entity");
let ProvablyFairModule = class ProvablyFairModule {
};
exports.ProvablyFairModule = ProvablyFairModule;
exports.ProvablyFairModule = ProvablyFairModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([fair_seed_state_entity_1.FairSeedState])],
        providers: [provably_fair_service_1.ProvablyFairService],
        exports: [provably_fair_service_1.ProvablyFairService, typeorm_1.TypeOrmModule],
    })
], ProvablyFairModule);
//# sourceMappingURL=provably-fair.module.js.map
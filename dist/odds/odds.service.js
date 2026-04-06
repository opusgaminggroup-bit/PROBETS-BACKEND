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
exports.OddsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rxjs_1 = require("rxjs");
const event_entity_1 = require("../events/entities/event.entity");
const event_status_enum_1 = require("../common/enums/event-status.enum");
let OddsService = class OddsService {
    httpService;
    eventRepo;
    apiKey = process.env.ODDS_API_KEY;
    baseUrl = 'https://api.the-odds-api.com/v4';
    constructor(httpService, eventRepo) {
        this.httpService = httpService;
        this.eventRepo = eventRepo;
    }
    ensureApiKey() {
        if (!this.apiKey) {
            throw new common_1.HttpException('ODDS_API_KEY is missing', 500);
        }
    }
    async getSports() {
        this.ensureApiKey();
        const url = `${this.baseUrl}/sports?apiKey=${this.apiKey}`;
        const response = await (0, rxjs_1.lastValueFrom)(this.httpService.get(url));
        return response.data;
    }
    async getOdds(params) {
        this.ensureApiKey();
        const regions = params.regions ?? 'eu';
        const markets = params.markets ?? 'h2h,spreads,totals';
        const bookmakers = params.bookmakers ? `&bookmakers=${params.bookmakers}` : '';
        const url = `${this.baseUrl}/sports/${params.sport}/odds/?apiKey=${this.apiKey}&regions=${regions}&markets=${markets}&oddsFormat=decimal${bookmakers}`;
        const response = await (0, rxjs_1.lastValueFrom)(this.httpService.get(url));
        return response.data;
    }
    async getScores(sport) {
        this.ensureApiKey();
        const url = `${this.baseUrl}/sports/${sport}/scores/?apiKey=${this.apiKey}`;
        const response = await (0, rxjs_1.lastValueFrom)(this.httpService.get(url));
        return response.data;
    }
    async refreshSportOdds(params) {
        const data = await this.getOdds(params);
        for (const item of data) {
            const event = this.eventRepo.create({
                eventId: item.id,
                sportKey: item.sport_key,
                homeTeam: item.home_team,
                awayTeam: item.away_team,
                commenceTime: item.commence_time ? new Date(item.commence_time) : null,
                lastUpdated: item.last_update ? new Date(item.last_update) : new Date(),
                status: event_status_enum_1.EventStatus.UPCOMING,
                bookmakersJson: item.bookmakers ?? [],
            });
            await this.eventRepo.save(event);
        }
        return { ok: true, count: data.length };
    }
    async getEventOddsFromCache(eventId) {
        const event = await this.eventRepo.findOne({ where: { eventId } });
        if (!event)
            return null;
        return {
            id: event.eventId,
            sport_key: event.sportKey,
            home_team: event.homeTeam,
            away_team: event.awayTeam,
            commence_time: event.commenceTime,
            last_update: event.lastUpdated,
            bookmakers: event.bookmakersJson ?? [],
        };
    }
};
exports.OddsService = OddsService;
exports.OddsService = OddsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(event_entity_1.EventEntity)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        typeorm_2.Repository])
], OddsService);
//# sourceMappingURL=odds.service.js.map
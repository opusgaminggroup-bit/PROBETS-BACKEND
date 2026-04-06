import { HttpException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import { EventEntity } from '../events/entities/event.entity';
import { EventStatus } from '../common/enums/event-status.enum';

@Injectable()
export class OddsService {
  private readonly apiKey = process.env.ODDS_API_KEY;
  private readonly baseUrl = 'https://api.the-odds-api.com/v4';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(EventEntity) private readonly eventRepo: Repository<EventEntity>,
  ) {}

  private ensureApiKey() {
    if (!this.apiKey) {
      throw new HttpException('ODDS_API_KEY is missing', 500);
    }
  }

  async getSports() {
    this.ensureApiKey();
    const url = `${this.baseUrl}/sports?apiKey=${this.apiKey}`;
    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  }

  async getOdds(params: { sport: string; regions?: string; markets?: string; bookmakers?: string }) {
    this.ensureApiKey();
    const regions = params.regions ?? 'eu';
    const markets = params.markets ?? 'h2h,spreads,totals';
    const bookmakers = params.bookmakers ? `&bookmakers=${params.bookmakers}` : '';
    const url = `${this.baseUrl}/sports/${params.sport}/odds/?apiKey=${this.apiKey}&regions=${regions}&markets=${markets}&oddsFormat=decimal${bookmakers}`;

    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  }

  async getScores(sport: string) {
    this.ensureApiKey();
    const url = `${this.baseUrl}/sports/${sport}/scores/?apiKey=${this.apiKey}`;
    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  }

  async refreshSportOdds(params: { sport: string; regions?: string; markets?: string; bookmakers?: string }) {
    const data = await this.getOdds(params);

    for (const item of data) {
      const event = this.eventRepo.create({
        eventId: item.id,
        sportKey: item.sport_key,
        homeTeam: item.home_team,
        awayTeam: item.away_team,
        commenceTime: item.commence_time ? new Date(item.commence_time) : null,
        lastUpdated: item.last_update ? new Date(item.last_update) : new Date(),
        status: EventStatus.UPCOMING,
        bookmakersJson: item.bookmakers ?? [],
      });

      await this.eventRepo.save(event);
    }

    return { ok: true, count: data.length };
  }

  async getEventOddsFromCache(eventId: string) {
    const event = await this.eventRepo.findOne({ where: { eventId } });
    if (!event) return null;

    return {
      id: event.eventId,
      sport_key: event.sportKey,
      home_team: event.homeTeam,
      away_team: event.awayTeam,
      commence_time: event.commenceTime,
      last_update: event.lastUpdated,
      bookmakers: (event.bookmakersJson as any[]) ?? [],
    };
  }
}

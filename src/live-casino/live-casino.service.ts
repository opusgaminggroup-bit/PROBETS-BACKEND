import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { LiveCasinoSession } from './entities/live-casino-session.entity';
import { Bet } from '../bets/entities/bet.entity';
import { LiveCasinoGameConfig } from './entities/live-casino-game-config.entity';
import { CreditTransaction } from '../credit/entities/credit-transaction.entity';
import { CreditTransactionType } from '../common/enums/credit-transaction-type.enum';
import { BetType } from '../common/enums/bet-type.enum';
import * as crypto from 'crypto';
import { UpsertLiveGameConfigDto } from './dto/upsert-live-game-config.dto';
import { SitesService } from '../sites/sites.service';
import { BetResultStatus } from '../common/enums/bet-result-status.enum';
import { EvolutionAdapter } from './adapters/evolution.adapter';
import { PragmaticLiveAdapter } from './adapters/pragmatic-live.adapter';
import { LiveCasinoProviderAdapter } from './adapters/live-casino-provider.adapter';

@Injectable()
export class LiveCasinoService {
  private readonly adapters: Record<string, LiveCasinoProviderAdapter>;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(LiveCasinoSession)
    private readonly sessionRepo: Repository<LiveCasinoSession>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(LiveCasinoGameConfig)
    private readonly gameConfigRepo: Repository<LiveCasinoGameConfig>,
    @InjectRepository(Bet)
    private readonly betRepo: Repository<Bet>,
    @InjectRepository(CreditTransaction)
    private readonly txRepo: Repository<CreditTransaction>,
    private readonly sitesService: SitesService,
  ) {
    const evo = new EvolutionAdapter();
    const ppl = new PragmaticLiveAdapter();
    this.adapters = {
      [evo.provider]: evo,
      [ppl.provider]: ppl,
    };
  }

  getActiveProviderName(defaultProvider?: string) {
    return String(defaultProvider ?? process.env.LIVE_CASINO_PROVIDER ?? 'evolution').toLowerCase();
  }

  getAdapter(provider?: string, defaultProvider?: string) {
    const key = String(provider ?? this.getActiveProviderName(defaultProvider)).toLowerCase();
    const adapter = this.adapters[key];
    if (!adapter) {
      throw new BadRequestException(`Unsupported live casino provider: ${key}`);
    }
    return adapter;
  }

  private async resolveSiteContext(siteKey?: string) {
    const site = await this.sitesService.resolveSite(siteKey);
    return {
      siteKey: site?.siteKey ?? siteKey ?? 'default',
      liveCasinoProvider: site?.liveCasinoProvider ?? process.env.LIVE_CASINO_PROVIDER ?? 'evolution',
      currency: site?.currency ?? process.env.LIVE_CASINO_DEFAULT_CURRENCY ?? 'MYR',
    };
  }

  async listGames(query: { siteKey?: string; provider?: string; category?: string; page?: number; limit?: number }) {
    const siteCtx = await this.resolveSiteContext(query.siteKey);
    const adapter = this.getAdapter(query.provider, siteCtx.liveCasinoProvider);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Math.min(200, Number(query.limit ?? 20)));

    const { items, total } = await adapter.listGames({
      category: query.category,
      page,
      limit,
    });

    const cfgRows = await this.gameConfigRepo.find({ where: { siteKey: siteCtx.siteKey, provider: adapter.provider } as any });
    const cfgMap = new Map(cfgRows.map((x) => [`${x.provider}::${x.gameId}`, x]));

    const enriched = items
      .map((g) => {
        const cfg = cfgMap.get(`${adapter.provider}::${g.gameId}`);
        return {
          ...g,
          enabled: cfg ? Boolean(cfg.enabled) : g.enabled,
          sortOrder: cfg ? Number(cfg.sortOrder ?? 0) : 9999,
        };
      })
      .sort((a, b) => Number(a.sortOrder ?? 9999) - Number(b.sortOrder ?? 9999));

    return {
      ok: true,
      data: enriched,
      meta: {
        provider: adapter.provider,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async launchGame(input: {
    userId: string;
    gameId: string;
    siteKey?: string;
    provider?: string;
    locale?: string;
    currency?: string;
  }) {
    const siteCtx = await this.resolveSiteContext(input.siteKey);
    const adapter = this.getAdapter(input.provider, siteCtx.liveCasinoProvider);

    const launch = await adapter.launchGame({
      userId: input.userId,
      gameId: input.gameId,
      locale: input.locale,
      currency: input.currency ?? siteCtx.currency,
    });

    let session = await this.sessionRepo.findOne({ where: { sessionId: launch.sessionId } });
    if (!session) {
      session = this.sessionRepo.create({
        sessionId: launch.sessionId,
        siteKey: siteCtx.siteKey,
        provider: adapter.provider,
        gameId: input.gameId,
        userId: input.userId,
        status: 'active',
        launchUrl: launch.launchUrl,
        metaJson: { expiresAt: launch.expiresAt, providerRef: launch.providerRef },
      });
    } else {
      session.launchUrl = launch.launchUrl;
      session.status = 'active';
      session.metaJson = { expiresAt: launch.expiresAt, providerRef: launch.providerRef };
    }
    await this.sessionRepo.save(session);

    return {
      ok: true,
      data: {
        provider: adapter.provider,
        sessionId: launch.sessionId,
        launchUrl: launch.launchUrl,
        expiresAt: launch.expiresAt,
      },
    };
  }

  private verifyCallbackSignature(rawPayload: any, signatureHeader?: string) {
    const secret = process.env.LIVE_CASINO_CALLBACK_SECRET;
    if (!secret) return;

    if (!signatureHeader) {
      throw new BadRequestException('Missing callback signature');
    }

    const bodyStr = typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload ?? {});
    const expected = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
    if (expected !== signatureHeader) {
      throw new BadRequestException('Invalid callback signature');
    }
  }

  async handleCallback(payload: any, signatureHeader?: string) {
    this.verifyCallbackSignature(payload, signatureHeader);
    const adapter = this.getAdapter(payload?.provider);
    const normalized = await adapter.normalizeCallback(payload);

    if (!normalized.txId) throw new BadRequestException('callback txId required');
    if (!normalized.userId) throw new BadRequestException('callback userId required');

    const existingBet = await this.betRepo.findOne({ where: { betNo: normalized.txId } });
    if (existingBet && normalized.action === 'bet') {
      return { ok: true, message: 'duplicated bet callback ignored', data: { txId: normalized.txId } };
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: normalized.userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');

      const before = Number(user.creditBalance);
      const amount = Number(normalized.amount ?? 0);

      if (normalized.action === 'bet') {
        if (amount <= 0) throw new BadRequestException('bet amount must > 0');
        if (before < amount) throw new BadRequestException('Insufficient credit');

        const after = before - amount;
        user.creditBalance = after.toFixed(2);
        await manager.save(User, user);

        const bet = manager.create(Bet, {
          betNo: normalized.txId,
          userId: user.id,
          betType: BetType.LIVE_CASINO,
          amount: amount.toFixed(2),
          odds: null,
          resultStatus: BetResultStatus.PENDING,
          payout: '0.00',
          eventId: normalized.gameId ?? null,
          marketKey: normalized.provider,
          selection: normalized.sessionId ?? null,
          apiSnapshot: normalized.meta ?? {},
        });
        await manager.save(Bet, bet);

        const tx = manager.create(CreditTransaction, {
          userId: user.id,
          operatorId: process.env.SYSTEM_ADMIN_ID ?? user.id,
          amount: (-amount).toFixed(2),
          type: CreditTransactionType.BET_PLACE,
          referenceId: normalized.txId,
          remark: `${normalized.provider} live-casino bet`,
          balanceBefore: before.toFixed(2),
          balanceAfter: after.toFixed(2),
        });
        await manager.save(CreditTransaction, tx);

        return { ok: true, data: { action: normalized.action, txId: normalized.txId } };
      }

      const bet = await manager.findOne(Bet, {
        where: { betNo: normalized.txId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!bet) throw new NotFoundException('Bet not found for callback txId');

      if (normalized.action === 'cancel') {
        if (bet.resultStatus !== BetResultStatus.PENDING) {
          return { ok: true, message: 'already settled/canceled', data: { txId: normalized.txId } };
        }

        const refund = Number(bet.amount ?? 0);
        const after = before + refund;
        user.creditBalance = after.toFixed(2);
        await manager.save(User, user);

        bet.resultStatus = BetResultStatus.CANCEL;
        bet.payout = refund.toFixed(2);
        bet.settledAt = new Date();
        await manager.save(Bet, bet);

        const tx = manager.create(CreditTransaction, {
          userId: user.id,
          operatorId: process.env.SYSTEM_ADMIN_ID ?? user.id,
          amount: refund.toFixed(2),
          type: CreditTransactionType.BET_PUSH,
          referenceId: normalized.txId,
          remark: `${normalized.provider} live-casino cancel refund`,
          balanceBefore: before.toFixed(2),
          balanceAfter: after.toFixed(2),
        });
        await manager.save(CreditTransaction, tx);

        return { ok: true, data: { action: normalized.action, txId: normalized.txId } };
      }

      if (normalized.action === 'settle') {
        const payout = Number(normalized.payout ?? 0);
        const after = before + payout;

        user.creditBalance = after.toFixed(2);
        await manager.save(User, user);

        bet.resultStatus = payout > 0 ? BetResultStatus.WIN : BetResultStatus.LOSS;
        bet.payout = payout.toFixed(2);
        bet.settledAt = new Date();
        bet.apiSnapshot = {
          ...(typeof bet.apiSnapshot === 'object' && bet.apiSnapshot ? (bet.apiSnapshot as object) : {}),
          settleMeta: normalized.meta ?? {},
        };
        await manager.save(Bet, bet);

        const tx = manager.create(CreditTransaction, {
          userId: user.id,
          operatorId: process.env.SYSTEM_ADMIN_ID ?? user.id,
          amount: payout.toFixed(2),
          type: payout > 0 ? CreditTransactionType.BET_WIN : CreditTransactionType.BET_LOSS,
          referenceId: normalized.txId,
          remark: `${normalized.provider} live-casino settle`,
          balanceBefore: before.toFixed(2),
          balanceAfter: after.toFixed(2),
        });
        await manager.save(CreditTransaction, tx);

        return { ok: true, data: { action: normalized.action, txId: normalized.txId, payout } };
      }

      throw new BadRequestException(`Unsupported callback action: ${normalized.action}`);
    });
  }

  async getSession(sessionId: string) {
    const local = await this.sessionRepo.findOne({ where: { sessionId } });
    if (!local) throw new NotFoundException('Session not found');

    const adapter = this.getAdapter(local.provider);
    const providerSession = await adapter.getSession(sessionId);

    return {
      ok: true,
      data: {
        local,
        providerSession,
      },
    };
  }

  async getBalance(userId: string, provider?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const adapter = this.getAdapter(provider);
    const providerBalance = await adapter.getBalance(userId);

    return {
      ok: true,
      data: {
        userId,
        creditBalance: Number(user.creditBalance),
        provider: adapter.provider,
        providerBalance,
      },
    };
  }

  async providerStatuses() {
    const keys = Object.keys(this.adapters);
    const data = [] as any[];

    for (const k of keys) {
      const adapter = this.adapters[k];
      const health = adapter.health ? await adapter.health() : { ok: true };
      data.push({
        provider: adapter.provider,
        active: adapter.provider === this.getActiveProviderName(),
        health,
      });
    }

    return { ok: true, data };
  }

  async upsertGameConfig(dto: UpsertLiveGameConfigDto) {
    return this.dataSource.transaction(async (manager) => {
      const siteKey = dto.siteKey ?? 'default';
      let row = await manager.findOne(LiveCasinoGameConfig, {
        where: { siteKey, provider: dto.provider, gameId: dto.gameId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!row) {
        row = manager.create(LiveCasinoGameConfig, {
          siteKey,
          provider: dto.provider,
          gameId: dto.gameId,
          enabled: dto.enabled ?? true,
          sortOrder: dto.sortOrder ?? 0,
        });
      } else {
        if (dto.enabled != null) row.enabled = dto.enabled;
        if (dto.sortOrder != null) row.sortOrder = dto.sortOrder;
      }

      await manager.save(LiveCasinoGameConfig, row);
      return { ok: true, data: row, message: 'Live casino game config updated' };
    });
  }
}

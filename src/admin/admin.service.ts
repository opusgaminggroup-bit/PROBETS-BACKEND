import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Bet } from '../bets/entities/bet.entity';
import { CreditTransaction } from '../credit/entities/credit-transaction.entity';
import { BetExposure } from '../bets/entities/bet-exposure.entity';
import { SportsBetQueue } from '../bets/entities/sports-bet-queue.entity';
import { Role } from '../common/enums/role.enum';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { AdminCreditTxQueryDto } from './dto/admin-credit-tx-query.dto';
import { LiveCasinoSession } from '../live-casino/entities/live-casino-session.entity';
import { AdminBetsQueryDto } from './dto/admin-bets-query.dto';
import { SettleBetDto } from '../bets/dto/settle-bet.dto';
import { BetsService } from '../bets/bets.service';
import { AdjustCreditDto } from '../credit/dto/adjust-credit.dto';
import { CreditService } from '../credit/credit.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { LiveCasinoService } from '../live-casino/live-casino.service';
import { BetType } from '../common/enums/bet-type.enum';
import { UpsertLiveGameConfigDto } from '../live-casino/dto/upsert-live-game-config.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Bet) private readonly betRepo: Repository<Bet>,
    @InjectRepository(CreditTransaction)
    private readonly txRepo: Repository<CreditTransaction>,
    @InjectRepository(BetExposure)
    private readonly exposureRepo: Repository<BetExposure>,
    @InjectRepository(SportsBetQueue)
    private readonly queueRepo: Repository<SportsBetQueue>,
    @InjectRepository(LiveCasinoSession)
    private readonly liveSessionRepo: Repository<LiveCasinoSession>,
    private readonly betsService: BetsService,
    private readonly creditService: CreditService,
    private readonly liveCasinoService: LiveCasinoService,
  ) {}

  private async getScopeUserIds(actor: { userId: string; role: string }): Promise<string[] | null> {
    if (actor.role === Role.ADMIN) return null;
    if (actor.role !== Role.SUPERAGENT) {
      throw new ForbiddenException('Only admin/superagent can access admin endpoints');
    }

    const selfId = String(actor.userId);
    const directChildren = await this.userRepo.find({
      where: { parentId: selfId },
      select: { id: true },
    });
    const directIds = directChildren.map((u) => String(u.id));

    const secondLevel = directIds.length
      ? await this.userRepo.find({
          where: { parentId: In(directIds) },
          select: { id: true },
        })
      : [];

    const secondIds = secondLevel.map((u) => String(u.id));
    return Array.from(new Set([selfId, ...directIds, ...secondIds]));
  }

  async listUsers(actor: { userId: string; role: string }, query: AdminUsersQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Math.min(200, Number(query.limit ?? 20)));
    const skip = (page - 1) * limit;
    const sortBy = ['createdAt', 'updatedAt', 'username', 'role', 'creditBalance', 'creditLimit'].includes(
      String(query.sortBy ?? ''),
    )
      ? String(query.sortBy)
      : 'createdAt';
    const sortOrder = String(query.sortOrder ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const scopedIds = await this.getScopeUserIds(actor);

    const qb = this.userRepo.createQueryBuilder('u');
    if (scopedIds) qb.andWhere('u.id IN (:...scopedIds)', { scopedIds });
    if (query.role) qb.andWhere('u.role = :role', { role: query.role });
    if (query.parentId) qb.andWhere('u.parent_id = :parentId', { parentId: query.parentId });
    if (query.username) qb.andWhere('u.username LIKE :username', { username: `%${query.username}%` });
    if (query.minCreditBalance != null) qb.andWhere('u.credit_balance >= :minCreditBalance', { minCreditBalance: query.minCreditBalance });
    if (query.maxCreditBalance != null) qb.andWhere('u.credit_balance <= :maxCreditBalance', { maxCreditBalance: query.maxCreditBalance });

    qb.orderBy(`u.${sortBy}`, sortOrder as 'ASC' | 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      ok: true,
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getUserDetail(actor: { userId: string; role: string }, id: string) {
    const scopedIds = await this.getScopeUserIds(actor);
    if (scopedIds && !scopedIds.includes(String(id))) {
      throw new ForbiddenException('No access to this user');
    }

    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const [children, recentBets] = await Promise.all([
      this.userRepo.find({ where: { parentId: id }, select: { id: true, username: true, role: true, isActive: true } as any }),
      this.betRepo.find({
        where: { userId: id },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      ok: true,
      data: {
        ...user,
        children,
        childrenCount: children.length,
        recentBets,
      },
    };
  }

  async getAgentTree(actor: { userId: string; role: string }) {
    const scopedIds = await this.getScopeUserIds(actor);
    const roots = actor.role === Role.ADMIN
      ? await this.userRepo.find({ where: { role: Role.SUPERAGENT } as any })
      : await this.userRepo.find({ where: { id: actor.userId } as any });

    const build = async (node: User, depth = 0): Promise<any> => {
      if (depth > 3) return { id: node.id, username: node.username, role: node.role, children: [] };
      const children = await this.userRepo.find({ where: { parentId: node.id } });
      const filtered = scopedIds ? children.filter((c) => scopedIds.includes(String(c.id))) : children;
      return {
        id: node.id,
        username: node.username,
        role: node.role,
        isActive: node.isActive,
        children: await Promise.all(filtered.map((c) => build(c, depth + 1))),
      };
    };

    return { ok: true, data: await Promise.all(roots.map((r) => build(r))) };
  }

  async createUser(actor: { userId: string; role: string }, dto: CreateUserDto) {
    if (actor.role === Role.SUPERAGENT) {
      if (dto.parentId && dto.parentId !== actor.userId) {
        throw new ForbiddenException('Superagent can only create direct children under self');
      }
      dto.parentId = actor.userId;
      if (![Role.AGENT, Role.PLAYER].includes(dto.role)) {
        throw new ForbiddenException('Superagent can only create agent/player');
      }
    }

    const user = this.userRepo.create({
      username: dto.username,
      passwordHash: dto.passwordHash,
      role: dto.role,
      parentId: dto.parentId ?? null,
    });

    const saved = await this.userRepo.save(user);
    this.logger.log(`admin create user actor=${actor.userId} target=${saved.id} role=${saved.role}`);

    return {
      ok: true,
      data: saved,
      message: 'User created',
    };
  }

  async updateUserStatus(actor: { userId: string; role: string }, id: string, enabled: boolean) {
    const scopedIds = await this.getScopeUserIds(actor);
    if (scopedIds && !scopedIds.includes(String(id))) {
      throw new ForbiddenException('No access to this user');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');

      user.isActive = enabled;
      await manager.save(User, user);

      this.logger.warn(
        `admin update status actor=${actor.userId} target=${id} enabled=${String(enabled)}`,
      );

      return {
        ok: true,
        data: { id: user.id, isActive: user.isActive },
        message: enabled ? 'User enabled' : 'User disabled',
      };
    });
  }

  async updateUser(actor: { userId: string; role: string }, id: string, dto: UpdateUserDto) {
    const scopedIds = await this.getScopeUserIds(actor);
    if (scopedIds && !scopedIds.includes(String(id))) {
      throw new ForbiddenException('No access to this user');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');

      if (dto.enabled != null) user.isActive = dto.enabled;
      if (dto.creditLimit != null) user.creditLimit = Number(dto.creditLimit).toFixed(2);
      if (dto.parentId != null && actor.role === Role.ADMIN) user.parentId = dto.parentId;

      await manager.save(User, user);
      return { ok: true, data: user, message: 'User updated' };
    });
  }

  async listCreditTransactions(
    actor: { userId: string; role: string },
    query: AdminCreditTxQueryDto,
  ) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Math.min(200, Number(query.limit ?? 20)));
    const skip = (page - 1) * limit;
    const sortBy = ['createdAt', 'amount', 'type'].includes(String(query.sortBy ?? ''))
      ? String(query.sortBy)
      : 'createdAt';
    const sortOrder = String(query.sortOrder ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const scopedIds = await this.getScopeUserIds(actor);

    const qb = this.txRepo.createQueryBuilder('tx');
    qb.leftJoinAndSelect('tx.user', 'user').leftJoinAndSelect('tx.operator', 'operator');

    if (query.userId) qb.andWhere('tx.user_id = :userId', { userId: query.userId });
    if (query.operatorId) qb.andWhere('tx.operator_id = :operatorId', { operatorId: query.operatorId });
    if (query.type) qb.andWhere('tx.type = :type', { type: query.type });
    if (query.startDate) qb.andWhere('tx.created_at >= :startDate', { startDate: query.startDate });
    if (query.endDate) qb.andWhere('tx.created_at <= :endDate', { endDate: query.endDate });

    if (scopedIds) {
      qb.andWhere('(tx.user_id IN (:...scopedIds) OR tx.operator_id IN (:...scopedIds))', {
        scopedIds,
      });
    }

    qb.orderBy(`tx.${sortBy}`, sortOrder as 'ASC' | 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      ok: true,
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async adminCreditAdjust(actor: { userId: string; role: string }, dto: AdjustCreditDto) {
    return this.creditService.adjustCredit({ ...dto, operatorId: actor.userId });
  }

  async listBets(actor: { userId: string; role: string }, query: AdminBetsQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Math.min(200, Number(query.limit ?? 20)));
    const skip = (page - 1) * limit;
    const sortBy = ['createdAt', 'amount', 'settledAt', 'betType'].includes(String(query.sortBy ?? ''))
      ? String(query.sortBy)
      : 'createdAt';
    const sortOrder = String(query.sortOrder ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const scopedIds = await this.getScopeUserIds(actor);

    const qb = this.betRepo.createQueryBuilder('b');
    if (query.betType) qb.andWhere('b.bet_type = :betType', { betType: query.betType });
    if (query.resultStatus) qb.andWhere('b.result_status = :resultStatus', { resultStatus: query.resultStatus });
    if (query.userId) qb.andWhere('b.user_id = :userId', { userId: query.userId });
    if (query.startDate) qb.andWhere('b.created_at >= :startDate', { startDate: query.startDate });
    if (query.endDate) qb.andWhere('b.created_at <= :endDate', { endDate: query.endDate });
    if (scopedIds) qb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });

    qb.orderBy(`b.${sortBy}`, sortOrder as 'ASC' | 'DESC').skip(skip).take(limit);
    const [items, total] = await qb.getManyAndCount();

    return { ok: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async getBetByNo(actor: { userId: string; role: string }, betNo: string) {
    const scopedIds = await this.getScopeUserIds(actor);
    const bet = await this.betRepo.findOne({ where: { betNo } });
    if (!bet) throw new NotFoundException('Bet not found');
    if (scopedIds && !scopedIds.includes(String(bet.userId))) throw new ForbiddenException('No access to this bet');
    return { ok: true, data: bet };
  }

  async settleBet(actor: { userId: string; role: string }, betNo: string, dto: SettleBetDto) {
    return this.betsService.settleBet({ ...dto, betNo, operatorId: actor.userId });
  }

  async getSportsExposure(actor: { userId: string; role: string }) {
    const scopedIds = await this.getScopeUserIds(actor);

    const qb = this.exposureRepo
      .createQueryBuilder('e')
      .select('e.event_id', 'eventId')
      .addSelect('e.market_key', 'marketKey')
      .addSelect('COUNT(DISTINCT e.user_id)', 'userCount')
      .addSelect('SUM(e.total_stake)', 'totalStake')
      .addSelect('SUM(e.total_potential_payout)', 'totalPotentialPayout')
      .groupBy('e.event_id')
      .addGroupBy('e.market_key')
      .orderBy('SUM(e.total_potential_payout)', 'DESC');

    if (scopedIds) qb.where('e.user_id IN (:...scopedIds)', { scopedIds });

    const rows = await qb.getRawMany();
    return {
      ok: true,
      data: rows.map((r) => {
        const stake = Number(r.totalStake ?? 0);
        const payout = Number(r.totalPotentialPayout ?? 0);
        return {
          eventId: r.eventId,
          marketKey: r.marketKey,
          userCount: Number(r.userCount ?? 0),
          totalStake: Number(stake.toFixed(2)),
          totalPotentialPayout: Number(payout.toFixed(2)),
          worstCaseLiability: Number(Math.max(0, payout - stake).toFixed(2)),
        };
      }),
    };
  }

  async getSportsDashboard(actor: { userId: string; role: string }, days = 7) {
    const scopedIds = await this.getScopeUserIds(actor);
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const nDaysAgo = new Date(now.getTime() - Math.max(1, Number(days)) * 24 * 3600 * 1000);

    const [today, nDays, active, exposureTop, queueRows, liveStats] = await Promise.all([
      (async () => {
        const qb = this.betRepo
          .createQueryBuilder('b')
          .select('SUM(b.amount)', 'stake')
          .addSelect('SUM(b.payout)', 'payout')
          .where('b.created_at >= :dayStart', { dayStart: dayStart.toISOString().slice(0, 19).replace('T', ' ') });
        if (scopedIds) qb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });
        return qb.getRawOne();
      })(),
      (async () => {
        const qb = this.betRepo
          .createQueryBuilder('b')
          .select('SUM(b.amount)', 'stake')
          .addSelect('SUM(b.payout)', 'payout')
          .where('b.created_at >= :nDaysAgo', {
            nDaysAgo: nDaysAgo.toISOString().slice(0, 19).replace('T', ' '),
          });
        if (scopedIds) qb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });
        return qb.getRawOne();
      })(),
      (async () => {
        const qb = this.betRepo
          .createQueryBuilder('b')
          .select('COUNT(DISTINCT b.user_id)', 'activeUsers')
          .where('b.created_at >= :nDaysAgo', {
            nDaysAgo: nDaysAgo.toISOString().slice(0, 19).replace('T', ' '),
          });
        if (scopedIds) qb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });
        return qb.getRawOne();
      })(),
      this.getSportsExposure(actor).then((x) => x.data.slice(0, 10)),
      this.queueRepo
        .createQueryBuilder('q')
        .select('q.status', 'status')
        .addSelect('COUNT(1)', 'count')
        .groupBy('q.status')
        .getRawMany(),
      this.getLiveCasinoStats(actor).then((x) => x.data),
    ]);

    const toMetrics = (row: any) => {
      const stake = Number(row?.stake ?? 0);
      const payout = Number(row?.payout ?? 0);
      return {
        totalStake: Number(stake.toFixed(2)),
        totalPayout: Number(payout.toFixed(2)),
        ggr: Number((stake - payout).toFixed(2)),
      };
    };

    const queueMap = queueRows.reduce(
      (acc, r) => {
        acc[String(r.status)] = Number(r.count ?? 0);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      ok: true,
      data: {
        today: toMetrics(today),
        lastNDays: toMetrics(nDays),
        activeUsers: Number(active?.activeUsers ?? 0),
        sportsExposureTop: exposureTop,
        queueStatus: queueMap,
        liveCasino: liveStats,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  async listSportsQueue(actor: { userId: string; role: string }, status?: string) {
    const scopedIds = await this.getScopeUserIds(actor);
    const qb = this.queueRepo.createQueryBuilder('q').orderBy('q.created_at', 'DESC').take(200);
    if (status) qb.andWhere('q.status = :status', { status });
    if (scopedIds) qb.andWhere('q.user_id IN (:...scopedIds)', { scopedIds });
    const items = await qb.getMany();
    return { ok: true, data: items };
  }

  async sportsQueueAction(
    actor: { userId: string; role: string },
    action: 'pause' | 'retry' | 'cancel',
    payload: { queueId?: string; minutes?: number },
  ) {
    await this.getScopeUserIds(actor);

    if (action === 'pause') {
      const mins = Math.max(0, Number(payload.minutes ?? 0));
      const data = await this.betsService.setQueuePause(mins);
      return { ok: true, data, message: mins > 0 ? 'queue paused' : 'queue resumed' };
    }

    if (!payload.queueId) throw new NotFoundException('queueId required');

    if (action === 'retry') {
      const data = await this.betsService.retryQueue(payload.queueId);
      return { ok: true, data, message: 'queue retry scheduled' };
    }

    const data = await this.betsService.cancelQueue(payload.queueId);
    return { ok: true, data, message: 'queue canceled' };
  }

  async listLiveCasinoGames(actor: { userId: string; role: string }, provider?: string, category?: string, page = 1, limit = 20) {
    await this.getScopeUserIds(actor);
    return this.liveCasinoService.listGames({ provider, category, page, limit });
  }

  async upsertLiveCasinoGameConfig(actor: { userId: string; role: string }, dto: UpsertLiveGameConfigDto) {
    await this.getScopeUserIds(actor);
    return this.liveCasinoService.upsertGameConfig(dto);
  }

  async listLiveCasinoSessions(actor: { userId: string; role: string }, page = 1, limit = 20) {
    const scopedIds = await this.getScopeUserIds(actor);
    const qb = this.liveSessionRepo.createQueryBuilder('s').orderBy('s.created_at', 'DESC');
    if (scopedIds) qb.andWhere('s.user_id IN (:...scopedIds)', { scopedIds });
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { ok: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async getLiveCasinoProviders(actor: { userId: string; role: string }) {
    await this.getScopeUserIds(actor);
    return this.liveCasinoService.providerStatuses();
  }

  async getLiveCasinoStats(actor: { userId: string; role: string }) {
    const scopedIds = await this.getScopeUserIds(actor);
    const qb = this.betRepo
      .createQueryBuilder('b')
      .select('SUM(b.amount)', 'stake')
      .addSelect('SUM(b.payout)', 'payout')
      .addSelect('COUNT(1)', 'count')
      .where('b.bet_type = :betType', { betType: BetType.LIVE_CASINO });
    if (scopedIds) qb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });
    const sums = await qb.getRawOne();

    const topQb = this.betRepo
      .createQueryBuilder('b')
      .select('b.event_id', 'gameId')
      .addSelect('COUNT(1)', 'count')
      .where('b.bet_type = :betType', { betType: BetType.LIVE_CASINO })
      .groupBy('b.event_id')
      .orderBy('COUNT(1)', 'DESC')
      .take(10);
    if (scopedIds) topQb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });
    const topGames = await topQb.getRawMany();

    const stake = Number(sums?.stake ?? 0);
    const payout = Number(sums?.payout ?? 0);

    return {
      ok: true,
      data: {
        totalBets: Number(sums?.count ?? 0),
        totalStake: Number(stake.toFixed(2)),
        totalPayout: Number(payout.toFixed(2)),
        ggr: Number((stake - payout).toFixed(2)),
        topGames,
      },
    };
  }

  async reportGgr(actor: { userId: string; role: string }, days = 7, gameType?: string) {
    const scopedIds = await this.getScopeUserIds(actor);
    const since = new Date(Date.now() - Math.max(1, Number(days)) * 24 * 3600 * 1000);

    const qb = this.betRepo
      .createQueryBuilder('b')
      .select('DATE(b.created_at)', 'date')
      .addSelect('b.bet_type', 'betType')
      .addSelect('SUM(b.amount)', 'stake')
      .addSelect('SUM(b.payout)', 'payout')
      .where('b.created_at >= :since', { since: since.toISOString().slice(0, 19).replace('T', ' ') })
      .groupBy('DATE(b.created_at)')
      .addGroupBy('b.bet_type')
      .orderBy('DATE(b.created_at)', 'DESC');

    if (gameType) qb.andWhere('b.bet_type = :gameType', { gameType });
    if (scopedIds) qb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });

    const rows = await qb.getRawMany();
    return {
      ok: true,
      data: rows.map((r) => {
        const stake = Number(r.stake ?? 0);
        const payout = Number(r.payout ?? 0);
        return { date: r.date, betType: r.betType, totalStake: stake, totalPayout: payout, ggr: Number((stake - payout).toFixed(2)) };
      }),
    };
  }

  async reportAgent(actor: { userId: string; role: string }, days = 7) {
    const scopedIds = await this.getScopeUserIds(actor);
    const since = new Date(Date.now() - Math.max(1, Number(days)) * 24 * 3600 * 1000);

    const qb = this.txRepo
      .createQueryBuilder('tx')
      .innerJoin(User, 'u', 'u.id = tx.user_id')
      .select('u.parent_id', 'agentId')
      .addSelect('SUM(CASE WHEN tx.type = :addType THEN tx.amount ELSE 0 END)', 'totalAdd')
      .addSelect('SUM(CASE WHEN tx.type = :subType THEN ABS(tx.amount) ELSE 0 END)', 'totalSub')
      .where('tx.created_at >= :since', { since: since.toISOString().slice(0, 19).replace('T', ' ') })
      .setParameters({ addType: 'add_credit', subType: 'subtract_credit' })
      .groupBy('u.parent_id')
      .orderBy('SUM(CASE WHEN tx.type = :addType THEN tx.amount ELSE 0 END)', 'DESC');

    if (scopedIds) qb.andWhere('(u.parent_id IN (:...scopedIds) OR tx.user_id IN (:...scopedIds))', { scopedIds });

    const rows = await qb.getRawMany();
    return {
      ok: true,
      data: rows.map((r) => {
        const add = Number(r.totalAdd ?? 0);
        const sub = Number(r.totalSub ?? 0);
        return {
          agentId: r.agentId,
          totalAdd: Number(add.toFixed(2)),
          totalRecycle: Number(sub.toFixed(2)),
          net: Number((add - sub).toFixed(2)),
        };
      }),
    };
  }
}

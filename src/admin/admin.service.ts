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
import { AdminPlayersRankingQueryDto } from './dto/admin-players-ranking-query.dto';
import { AdminGgrReportQueryDto } from './dto/admin-ggr-report-query.dto';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';

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
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
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

  async createUser(actor: { userId: string; username: string; role: string }, dto: CreateUserDto) {
    // SuperAgent scope restrictions
    if (actor.role === Role.SUPERAGENT) {
      if (dto.parentId && dto.parentId !== actor.userId) {
        throw new ForbiddenException('SuperAgent can only create direct children under self');
      }
      if (![Role.AGENT, Role.PLAYER].includes(dto.role)) {
        throw new ForbiddenException('SuperAgent can only create agent or player accounts');
      }
    }

    // Force parentId to the actor (controller also does this, but double-guard here)
    const parentId = actor.role === Role.ADMIN ? (dto.parentId ?? actor.userId) : actor.userId;

    // Delegate to UsersService which handles bcrypt hashing and duplicate checks
    const saved = await this.usersService.create({ ...dto, parentId });
    const savedId = String((saved as any).id);

    this.logger.log(`admin.createUser actor=${actor.userId} target=${savedId} role=${(saved as any).role}`);

    void this.auditService.log({
      actorId: actor.userId,
      actorUsername: actor.username,
      actorRole: actor.role,
      action: 'user.create',
      targetId: savedId,
      afterState: { username: (saved as any).username, role: (saved as any).role, parentId },
    });

    return { ok: true, data: saved, message: 'User created' };
  }

  async updateUserStatus(actor: { userId: string; username: string; role: string }, id: string, enabled: boolean) {
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

      const prevActive = user.isActive;
      user.isActive = enabled;
      await manager.save(User, user);

      this.logger.warn(`admin update status actor=${actor.userId} target=${id} enabled=${String(enabled)}`);

      void this.auditService.log({
        actorId: actor.userId,
        actorUsername: actor.username,
        actorRole: actor.role,
        action: enabled ? 'user.status.enable' : 'user.status.disable',
        targetId: id,
        beforeState: { isActive: prevActive },
        afterState:  { isActive: enabled },
      });

      return {
        ok: true,
        data: { id: user.id, isActive: user.isActive },
        message: enabled ? 'User enabled' : 'User disabled',
      };
    });
  }

  async updateUser(actor: { userId: string; username: string; role: string }, id: string, dto: UpdateUserDto) {
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

      const before = {
        isActive: user.isActive,
        creditLimit: user.creditLimit,
        parentId: user.parentId,
      };

      if (dto.enabled != null) user.isActive = dto.enabled;
      if (dto.creditLimit != null) user.creditLimit = Number(dto.creditLimit).toFixed(2);
      if (dto.parentId != null && actor.role === Role.ADMIN) user.parentId = dto.parentId;

      await manager.save(User, user);

      void this.auditService.log({
        actorId: actor.userId,
        actorUsername: actor.username,
        actorRole: actor.role,
        action: 'user.update',
        targetId: id,
        beforeState: before,
        afterState: { isActive: user.isActive, creditLimit: user.creditLimit, parentId: user.parentId },
      });

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

  async settleBet(actor: { userId: string; username: string; role: string }, betNo: string, dto: SettleBetDto) {
    const result = await this.betsService.settleBet({ ...dto, betNo, operatorId: actor.userId });
    void this.auditService.log({
      actorId: actor.userId,
      actorUsername: actor.username,
      actorRole: actor.role,
      action: 'bet.settle',
      targetId: betNo,
      afterState: { result: dto.result, betNo },
    });
    return result;
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
    actor: { userId: string; username: string; role: string },
    action: 'pause' | 'retry' | 'cancel',
    payload: { queueId?: string; minutes?: number },
  ) {
    await this.getScopeUserIds(actor);

    if (action === 'pause') {
      const mins = Math.max(0, Number(payload.minutes ?? 0));
      const data = await this.betsService.setQueuePause(mins);
      void this.auditService.log({
        actorId: actor.userId,
        actorUsername: actor.username,
        actorRole: actor.role,
        action: mins > 0 ? 'queue.pause' : 'queue.resume',
        afterState: { minutes: mins },
      });
      return { ok: true, data, message: mins > 0 ? 'queue paused' : 'queue resumed' };
    }

    if (!payload.queueId) throw new NotFoundException('queueId required');

    if (action === 'retry') {
      const data = await this.betsService.retryQueue(payload.queueId);
      void this.auditService.log({
        actorId: actor.userId,
        actorUsername: actor.username,
        actorRole: actor.role,
        action: 'queue.retry',
        targetId: payload.queueId,
      });
      return { ok: true, data, message: 'queue retry scheduled' };
    }

    const data = await this.betsService.cancelQueue(payload.queueId);
    void this.auditService.log({
      actorId: actor.userId,
      actorUsername: actor.username,
      actorRole: actor.role,
      action: 'queue.cancel',
      targetId: payload.queueId,
    });
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

  async getPlayersRanking(actor: { userId: string; role: string }, query: AdminPlayersRankingQueryDto) {
    const scopedIds = await this.getScopeUserIds(actor);
    const days = Math.max(1, Math.min(90, Number(query.days ?? 30)));
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Math.min(100, Number(query.limit ?? 20)));
    const skip = (page - 1) * limit;
    const sortMap: Record<string, string> = {
      totalBet: 'totalBet',
      netContribution: 'netContribution',
      creditBalance: 'creditBalance',
      lastActive: 'lastActive',
    };
    const sortKey = sortMap[String(query.sort ?? 'totalBet')] ?? 'totalBet';
    const sortOrder = String(query.order ?? 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const qb = this.userRepo
      .createQueryBuilder('p')
      .leftJoin(User, 'a', 'a.id = p.parent_id')
      .leftJoin(User, 'sa', 'sa.id = a.parent_id')
      .leftJoin(Bet, 'b', 'b.user_id = p.id AND b.created_at >= :since', {
        since: since.toISOString().slice(0, 19).replace('T', ' '),
      })
      .select('p.id', 'id')
      .addSelect('p.username', 'username')
      .addSelect("COALESCE(a.username, '-')", 'agentName')
      .addSelect("COALESCE(sa.username, '-')", 'superAgentName')
      .addSelect('COALESCE(SUM(b.amount), 0)', 'totalBet')
      .addSelect('COALESCE(SUM(b.payout - b.amount), 0)', 'totalPnl')
      .addSelect('COALESCE(SUM(b.amount - b.payout), 0)', 'netContribution')
      .addSelect('p.credit_balance', 'creditBalance')
      .addSelect('MAX(b.created_at)', 'lastActive')
      .where('p.role = :playerRole', { playerRole: Role.PLAYER })
      .groupBy('p.id')
      .addGroupBy('p.username')
      .addGroupBy('a.username')
      .addGroupBy('sa.username')
      .addGroupBy('p.credit_balance');

    if (query.search) qb.andWhere('p.username LIKE :search', { search: `%${query.search}%` });
    if (query.agentId) qb.andWhere('p.parent_id = :agentId', { agentId: query.agentId });

    if (scopedIds) {
      qb.andWhere('(p.id IN (:...scopedIds) OR p.parent_id IN (:...scopedIds))', { scopedIds });
    }

    qb.orderBy(sortKey, sortOrder as 'ASC' | 'DESC').offset(skip).limit(limit);
    const items = await qb.getRawMany();

    const countQb = this.userRepo
      .createQueryBuilder('p')
      .select('COUNT(1)', 'total')
      .where('p.role = :playerRole', { playerRole: Role.PLAYER });
    if (query.search) countQb.andWhere('p.username LIKE :search', { search: `%${query.search}%` });
    if (query.agentId) countQb.andWhere('p.parent_id = :agentId', { agentId: query.agentId });
    if (scopedIds) countQb.andWhere('(p.id IN (:...scopedIds) OR p.parent_id IN (:...scopedIds))', { scopedIds });
    const total = Number((await countQb.getRawOne())?.total ?? 0);

    return {
      ok: true,
      data: items.map((x) => ({
        id: String(x.id),
        username: x.username,
        agentName: x.agentName,
        superAgentName: x.superAgentName,
        totalBet: Number(Number(x.totalBet ?? 0).toFixed(2)),
        totalPnl: Number(Number(x.totalPnl ?? 0).toFixed(2)),
        netContribution: Number(Number(x.netContribution ?? 0).toFixed(2)),
        creditBalance: Number(Number(x.creditBalance ?? 0).toFixed(2)),
        lastActive: x.lastActive,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async getPlayersCreditDistribution(actor: { userId: string; role: string }, days = 30) {
    const scopedIds = await this.getScopeUserIds(actor);
    const since = new Date(Date.now() - Math.max(1, Number(days)) * 24 * 3600 * 1000);

    const bucketQb = this.userRepo
      .createQueryBuilder('p')
      .select(`SUM(CASE WHEN p.credit_balance > 10000 THEN 1 ELSE 0 END)`, 'high')
      .addSelect(`SUM(CASE WHEN p.credit_balance > 1000 AND p.credit_balance <= 10000 THEN 1 ELSE 0 END)`, 'mid')
      .addSelect(`SUM(CASE WHEN p.credit_balance > 0 AND p.credit_balance <= 1000 THEN 1 ELSE 0 END)`, 'low')
      .addSelect(`SUM(CASE WHEN p.credit_balance = 0 THEN 1 ELSE 0 END)`, 'zero')
      .where('p.role = :playerRole', { playerRole: Role.PLAYER });
    if (scopedIds) bucketQb.andWhere('(p.id IN (:...scopedIds) OR p.parent_id IN (:...scopedIds))', { scopedIds });
    const buckets = await bucketQb.getRawOne();

    const byAgentQb = this.userRepo
      .createQueryBuilder('p')
      .leftJoin(User, 'a', 'a.id = p.parent_id')
      .select("COALESCE(a.username, '-')", 'agent')
      .addSelect('COALESCE(SUM(p.credit_balance), 0)', 'totalCredit')
      .where('p.role = :playerRole', { playerRole: Role.PLAYER })
      .groupBy('a.username')
      .orderBy('SUM(p.credit_balance)', 'DESC');
    if (scopedIds) byAgentQb.andWhere('(p.id IN (:...scopedIds) OR p.parent_id IN (:...scopedIds))', { scopedIds });

    const relationQb = this.userRepo
      .createQueryBuilder('p')
      .leftJoin(Bet, 'b', 'b.user_id = p.id AND b.created_at >= :since', {
        since: since.toISOString().slice(0, 19).replace('T', ' '),
      })
      .select('p.username', 'username')
      .addSelect('p.credit_balance', 'credit')
      .addSelect('COALESCE(SUM(b.amount), 0)', 'bet')
      .where('p.role = :playerRole', { playerRole: Role.PLAYER })
      .groupBy('p.id')
      .addGroupBy('p.username')
      .addGroupBy('p.credit_balance')
      .orderBy('COALESCE(SUM(b.amount), 0)', 'DESC')
      .limit(300);
    if (scopedIds) relationQb.andWhere('(p.id IN (:...scopedIds) OR p.parent_id IN (:...scopedIds))', { scopedIds });

    const [byAgent, relation] = await Promise.all([byAgentQb.getRawMany(), relationQb.getRawMany()]);

    return {
      ok: true,
      data: {
        buckets: [
          { label: '高信用', value: Number(buckets?.high ?? 0) },
          { label: '中信用', value: Number(buckets?.mid ?? 0) },
          { label: '低信用', value: Number(buckets?.low ?? 0) },
          { label: '零信用', value: Number(buckets?.zero ?? 0) },
        ],
        byAgent: byAgent.map((r) => ({ agent: r.agent, totalCredit: Number(Number(r.totalCredit ?? 0).toFixed(2)) })),
        relation: relation.map((r) => ({ username: r.username, credit: Number(Number(r.credit ?? 0).toFixed(2)), bet: Number(Number(r.bet ?? 0).toFixed(2)) })),
      },
    };
  }

  async getPlayersBettingBehavior(actor: { userId: string; role: string }, days = 30) {
    const scopedIds = await this.getScopeUserIds(actor);
    const safeDays = Math.max(1, Math.min(90, Number(days)));
    const since = new Date(Date.now() - safeDays * 24 * 3600 * 1000);
    const sinceSql = since.toISOString().slice(0, 19).replace('T', ' ');

    const trendQb = this.betRepo
      .createQueryBuilder('b')
      .select('DATE(b.created_at)', 'day')
      .addSelect('COALESCE(SUM(b.amount), 0)', 'totalBet')
      .where('b.created_at >= :since', { since: sinceSql })
      .groupBy('DATE(b.created_at)')
      .orderBy('DATE(b.created_at)', 'ASC');
    if (scopedIds) trendQb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });

    const activeQb = this.betRepo
      .createQueryBuilder('b')
      .innerJoin(User, 'p', 'p.id = b.user_id')
      .select('p.username', 'username')
      .addSelect('COUNT(1)', 'frequency')
      .addSelect('COALESCE(SUM(b.amount), 0)', 'totalBet')
      .where('b.created_at >= :since', { since: sinceSql })
      .groupBy('p.username')
      .orderBy('COUNT(1)', 'DESC')
      .addOrderBy('COALESCE(SUM(b.amount), 0)', 'DESC')
      .limit(20);
    if (scopedIds) activeQb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });

    const gameShareQb = this.betRepo
      .createQueryBuilder('b')
      .select('b.bet_type', 'game')
      .addSelect('COUNT(1)', 'value')
      .where('b.created_at >= :since', { since: sinceSql })
      .groupBy('b.bet_type')
      .orderBy('COUNT(1)', 'DESC');
    if (scopedIds) gameShareQb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });

    const [trend, activeTop, gameShare] = await Promise.all([
      trendQb.getRawMany(),
      activeQb.getRawMany(),
      gameShareQb.getRawMany(),
    ]);

    return {
      ok: true,
      data: {
        trend: trend.map((r) => ({ day: r.day, totalBet: Number(Number(r.totalBet ?? 0).toFixed(2)) })),
        activeTop: activeTop.map((r) => ({ username: r.username, frequency: Number(r.frequency ?? 0), totalBet: Number(Number(r.totalBet ?? 0).toFixed(2)) })),
        gameShare: gameShare.map((r) => ({ game: r.game, value: Number(r.value ?? 0) })),
      },
    };
  }

  async getPlayerDetail(actor: { userId: string; role: string }, playerId: string) {
    const scopedIds = await this.getScopeUserIds(actor);
    if (scopedIds && !scopedIds.includes(String(playerId))) {
      throw new ForbiddenException('No access to this player');
    }

    const player = await this.userRepo
      .createQueryBuilder('p')
      .leftJoin(User, 'a', 'a.id = p.parent_id')
      .leftJoin(User, 'sa', 'sa.id = a.parent_id')
      .select('p.id', 'id')
      .addSelect('p.username', 'username')
      .addSelect('p.credit_balance', 'creditBalance')
      .addSelect("COALESCE(a.username, '-')", 'agentName')
      .addSelect("COALESCE(sa.username, '-')", 'superAgentName')
      .where('p.id = :playerId', { playerId })
      .andWhere('p.role = :playerRole', { playerRole: Role.PLAYER })
      .getRawOne();

    if (!player) throw new NotFoundException('Player not found');

    const [creditHistory, betHistory] = await Promise.all([
      this.txRepo.find({
        where: { userId: playerId },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.betRepo.find({
        where: { userId: playerId },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
    ]);

    return {
      ok: true,
      data: {
        player: {
          id: String(player.id),
          username: player.username,
          agentName: player.agentName,
          superAgentName: player.superAgentName,
          creditBalance: Number(Number(player.creditBalance ?? 0).toFixed(2)),
        },
        creditHistory: creditHistory.map((tx) => ({
          id: tx.id,
          amount: Number(Number(tx.amount ?? 0).toFixed(2)),
          type: tx.type,
          remark: tx.remark,
          at: tx.createdAt,
        })),
        betHistory: betHistory.map((b) => ({
          id: b.id,
          betNo: b.betNo,
          game: b.betType,
          stake: Number(Number(b.amount ?? 0).toFixed(2)),
          payout: Number(Number(b.payout ?? 0).toFixed(2)),
          result: b.resultStatus,
          at: b.createdAt,
        })),
      },
    };
  }

  async reportGgr(actor: { userId: string; role: string }, query: AdminGgrReportQueryDto) {
    const scopedIds = await this.getScopeUserIds(actor);

    const hasCustomRange = !!(query.startDate && query.endDate);
    const start = hasCustomRange
      ? new Date(query.startDate as string)
      : new Date(Date.now() - Math.max(1, Number(query.days ?? 30)) * 24 * 3600 * 1000);
    const end = hasCustomRange ? new Date(query.endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);

    const startSql = start.toISOString().slice(0, 19).replace('T', ' ');
    const endSql = end.toISOString().slice(0, 19).replace('T', ' ');
    const gameType = String(query.gameType ?? 'all').toLowerCase();

    const withScope = (qb: any, alias = 'b') => {
      qb.andWhere(`${alias}.created_at BETWEEN :start AND :end`, { start: startSql, end: endSql });
      if (gameType !== 'all') qb.andWhere(`${alias}.bet_type = :gameType`, { gameType });
      if (scopedIds) qb.andWhere(`${alias}.user_id IN (:...scopedIds)`, { scopedIds });
      return qb;
    };

    const summaryQb = withScope(
      this.betRepo
        .createQueryBuilder('b')
        .select('COALESCE(SUM(b.amount), 0)', 'totalStake')
        .addSelect('COALESCE(SUM(b.payout), 0)', 'totalPayout')
        .addSelect('COALESCE(COUNT(1), 0)', 'totalBets'),
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySql = todayStart.toISOString().slice(0, 19).replace('T', ' ');
    const todayQb = this.betRepo
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.amount), 0)', 'totalStake')
      .addSelect('COALESCE(SUM(b.payout), 0)', 'totalPayout')
      .where('b.created_at >= :today', { today: todaySql });
    if (gameType !== 'all') todayQb.andWhere('b.bet_type = :gameType', { gameType });
    if (scopedIds) todayQb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });

    const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime() + 1));
    const prevStartSql = prevStart.toISOString().slice(0, 19).replace('T', ' ');
    const prevEndSql = new Date(start.getTime() - 1).toISOString().slice(0, 19).replace('T', ' ');
    const prevQb = this.betRepo
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.amount), 0)', 'totalStake')
      .addSelect('COALESCE(SUM(b.payout), 0)', 'totalPayout')
      .where('b.created_at BETWEEN :start AND :end', { start: prevStartSql, end: prevEndSql });
    if (gameType !== 'all') prevQb.andWhere('b.bet_type = :gameType', { gameType });
    if (scopedIds) prevQb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });

    const trendQb = withScope(
      this.betRepo
        .createQueryBuilder('b')
        .select('DATE(b.created_at)', 'date')
        .addSelect('COALESCE(SUM(b.amount),0)', 'totalStake')
        .addSelect('COALESCE(SUM(b.payout),0)', 'totalPayout')
        .groupBy('DATE(b.created_at)')
        .orderBy('DATE(b.created_at)', 'ASC'),
    );

    const byGameQb = withScope(
      this.betRepo
        .createQueryBuilder('b')
        .select('b.bet_type', 'game')
        .addSelect('COALESCE(SUM(b.amount),0)', 'totalStake')
        .addSelect('COALESCE(SUM(b.payout),0)', 'totalPayout')
        .addSelect('COUNT(1)', 'betCount')
        .groupBy('b.bet_type')
        .orderBy('COALESCE(SUM(b.amount - b.payout),0)', 'DESC'),
    );

    const byAgentQb = withScope(
      this.betRepo
        .createQueryBuilder('b')
        .innerJoin(User, 'p', 'p.id = b.user_id')
        .leftJoin(User, 'a', 'a.id = p.parent_id')
        .select("COALESCE(a.id, '0')", 'agentId')
        .addSelect("COALESCE(a.username, '-')", 'agentName')
        .addSelect('COALESCE(SUM(b.amount),0)', 'totalStake')
        .addSelect('COALESCE(SUM(b.payout),0)', 'totalPayout')
        .addSelect('COUNT(DISTINCT p.id)', 'playersCount')
        .groupBy('a.id')
        .addGroupBy('a.username')
        .orderBy('COALESCE(SUM(b.amount - b.payout),0)', 'DESC')
        .limit(10),
    );

    const [summary, today, prev, trendRows, gameRows, agentRows] = await Promise.all([
      summaryQb.getRawOne(),
      todayQb.getRawOne(),
      prevQb.getRawOne(),
      trendQb.getRawMany(),
      byGameQb.getRawMany(),
      byAgentQb.getRawMany(),
    ]);

    const totalStake = Number(summary?.totalStake ?? 0);
    const totalPayout = Number(summary?.totalPayout ?? 0);
    const totalGgr = totalStake - totalPayout;

    const todayGgr = Number(today?.totalStake ?? 0) - Number(today?.totalPayout ?? 0);
    const prevGgr = Number(prev?.totalStake ?? 0) - Number(prev?.totalPayout ?? 0);
    const wow = prevGgr === 0 ? (todayGgr > 0 ? 100 : 0) : Number((((todayGgr - prevGgr) / Math.abs(prevGgr)) * 100).toFixed(2));

    const trend = trendRows.map((r) => {
      const stake = Number(r.totalStake ?? 0);
      const payout = Number(r.totalPayout ?? 0);
      return {
        date: r.date,
        totalStake: Number(stake.toFixed(2)),
        ggr: Number((stake - payout).toFixed(2)),
      };
    });

    const weekly: Array<{ period: string; ggr: number }> = [];
    for (let i = 0; i < trend.length; i += 7) {
      const chunk = trend.slice(i, i + 7);
      weekly.push({
        period: `${chunk[0]?.date ?? ''}~${chunk[chunk.length - 1]?.date ?? ''}`,
        ggr: Number(chunk.reduce((s, x) => s + x.ggr, 0).toFixed(2)),
      });
    }

    const gameBreakdown = gameRows.map((r) => {
      const stake = Number(r.totalStake ?? 0);
      const payout = Number(r.totalPayout ?? 0);
      const ggr = stake - payout;
      const rtp = stake <= 0 ? 0 : Number(((payout / stake) * 100).toFixed(2));
      return {
        game: r.game,
        totalStake: Number(stake.toFixed(2)),
        ggr: Number(ggr.toFixed(2)),
        rtp,
        winRate: Number((100 - rtp).toFixed(2)),
        betCount: Number(r.betCount ?? 0),
      };
    });

    const totalGgrAbsBase = Math.abs(totalGgr) || 1;
    const agentContribution = agentRows.map((r) => {
      const stake = Number(r.totalStake ?? 0);
      const payout = Number(r.totalPayout ?? 0);
      const ggr = stake - payout;
      return {
        agentId: String(r.agentId),
        agentName: r.agentName,
        ggr: Number(ggr.toFixed(2)),
        contributionRatio: Number(((ggr / totalGgrAbsBase) * 100).toFixed(2)),
        playersCount: Number(r.playersCount ?? 0),
      };
    });

    return {
      ok: true,
      data: {
        overview: {
          totalGgr: Number(totalGgr.toFixed(2)),
          todayGgr: Number(todayGgr.toFixed(2)),
          wow,
          totalStake: Number(totalStake.toFixed(2)),
          totalBets: Number(summary?.totalBets ?? 0),
        },
        trend,
        weekly,
        gameBreakdown,
        agentContribution,
      },
      meta: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        gameType,
      },
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

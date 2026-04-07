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
    const sortBy = ['createdAt', 'updatedAt', 'username', 'role', 'creditBalance'].includes(
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

    const [childrenCount, recentBets] = await Promise.all([
      this.userRepo.count({ where: { parentId: id } }),
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
        childrenCount,
        recentBets,
      },
    };
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

  async getSportsDashboard(actor: { userId: string; role: string }) {
    const scopedIds = await this.getScopeUserIds(actor);
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    const betBase = this.betRepo.createQueryBuilder('b');
    if (scopedIds) betBase.where('b.user_id IN (:...scopedIds)', { scopedIds });

    const [today, sevenDays, active, exposureTop, queueRows] = await Promise.all([
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
          .where('b.created_at >= :sevenDaysAgo', {
            sevenDaysAgo: sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' '),
          });
        if (scopedIds) qb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });
        return qb.getRawOne();
      })(),
      (async () => {
        const qb = this.betRepo
          .createQueryBuilder('b')
          .select('COUNT(DISTINCT b.user_id)', 'activeUsers')
          .where('b.created_at >= :sevenDaysAgo', {
            sevenDaysAgo: sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' '),
          });
        if (scopedIds) qb.andWhere('b.user_id IN (:...scopedIds)', { scopedIds });
        return qb.getRawOne();
      })(),
      (async () => {
        const qb = this.exposureRepo
          .createQueryBuilder('e')
          .select('e.event_id', 'eventId')
          .addSelect('e.market_key', 'marketKey')
          .addSelect('SUM(e.total_stake)', 'totalStake')
          .addSelect('SUM(e.total_potential_payout)', 'totalPotentialPayout')
          .groupBy('e.event_id')
          .addGroupBy('e.market_key')
          .orderBy('SUM(e.total_potential_payout)', 'DESC')
          .take(10);
        if (scopedIds) qb.where('e.user_id IN (:...scopedIds)', { scopedIds });
        return qb.getRawMany();
      })(),
      this.queueRepo
        .createQueryBuilder('q')
        .select('q.status', 'status')
        .addSelect('COUNT(1)', 'count')
        .groupBy('q.status')
        .getRawMany(),
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
        last7Days: toMetrics(sevenDays),
        activeUsers7Days: Number(active?.activeUsers ?? 0),
        exposureTop: exposureTop.map((r) => {
          const stake = Number(r.totalStake ?? 0);
          const payout = Number(r.totalPotentialPayout ?? 0);
          return {
            eventId: r.eventId,
            marketKey: r.marketKey,
            totalStake: Number(stake.toFixed(2)),
            totalPotentialPayout: Number(payout.toFixed(2)),
            worstCaseLiability: Number(Math.max(0, payout - stake).toFixed(2)),
          };
        }),
        queueStatus: queueMap,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaymentOrder } from './entities/payment-order.entity';
import { ManualAdapter } from './adapters/manual.adapter';
import { CryptoAdapter } from './adapters/crypto.adapter';
import { PaymentProviderAdapter } from './adapters/payment-provider.adapter';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreditService } from '../credit/credit.service';
import { CreditTransaction } from '../credit/entities/credit-transaction.entity';
import { CreditTransactionType } from '../common/enums/credit-transaction-type.enum';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';
import { AssignCreditDto } from './dto/assign-credit.dto';
import { SitesService } from '../sites/sites.service';

@Injectable()
export class PaymentService {
  private readonly adapters: Record<string, PaymentProviderAdapter>;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(PaymentOrder)
    private readonly paymentRepo: Repository<PaymentOrder>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CreditTransaction)
    private readonly txRepo: Repository<CreditTransaction>,
    private readonly creditService: CreditService,
    private readonly sitesService: SitesService,
  ) {
    const manual = new ManualAdapter();
    const cryptoA = new CryptoAdapter();
    this.adapters = {
      [manual.provider]: manual,
      [cryptoA.provider]: cryptoA,
    };
  }

  private getAdapter(provider?: string) {
    const key = String(provider ?? process.env.PAYMENT_PROVIDER ?? 'manual').toLowerCase();
    const adapter = this.adapters[key];
    if (!adapter) throw new BadRequestException(`Unsupported payment provider: ${key}`);
    return adapter;
  }

  private async resolveSiteContext(siteKey?: string) {
    const site = await this.sitesService.resolveSite(siteKey);
    return {
      siteKey: site?.siteKey ?? siteKey ?? 'default',
      currency: site?.currency ?? 'MYR',
      paymentProvider: site?.paymentProvider ?? process.env.PAYMENT_PROVIDER ?? 'manual',
    };
  }

  async assignCredit(dto: AssignCreditDto) {
    return this.creditService.adjustCredit({
      operatorId: dto.operatorId,
      targetUserId: dto.targetUserId,
      amount: dto.amount,
      action: 'add',
      remark: dto.remark ?? 'admin assign credit',
    });
  }

  async createOrder(dto: CreatePaymentDto, provider?: string) {
    if (!dto.userId) throw new BadRequestException('userId is required');
    const siteCtx = await this.resolveSiteContext(dto.siteKey);
    const adapter = this.getAdapter(provider ?? siteCtx.paymentProvider);
    const orderNo = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const result = await adapter.createOrder({
      type: dto.type,
      userId: dto.userId,
      amount: dto.amount,
      currency: dto.currency ?? siteCtx.currency,
      network: dto.network,
      walletAddress: dto.walletAddress,
      meta: { ...(dto.meta ?? {}), siteKey: siteCtx.siteKey },
    });

    const order = this.paymentRepo.create({
      orderNo,
      siteKey: siteCtx.siteKey,
      type: dto.type,
      provider: adapter.provider,
      status: result.status,
      userId: dto.userId,
      amount: Number(dto.amount).toFixed(2),
      currency: dto.currency ?? siteCtx.currency,
      network: dto.network ?? null,
      walletAddress: result.walletAddress ?? dto.walletAddress ?? null,
      channelRef: result.channelRef ?? null,
      metaJson: result.meta ?? dto.meta ?? null,
    });

    await this.paymentRepo.save(order);

    return {
      ok: true,
      data: order,
      message: result.message ?? 'Payment order created',
    };
  }

  async listOrders(query: { page?: number; limit?: number; status?: string; type?: string; userId?: string; siteKey?: string }) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Math.min(200, Number(query.limit ?? 20)));
    const qb = this.paymentRepo.createQueryBuilder('p').orderBy('p.created_at', 'DESC');

    if (query.status) qb.andWhere('p.status = :status', { status: query.status });
    if (query.type) qb.andWhere('p.type = :type', { type: query.type });
    if (query.userId) qb.andWhere('p.user_id = :userId', { userId: query.userId });
    if (query.siteKey) qb.andWhere('p.site_key = :siteKey', { siteKey: query.siteKey });

    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();

    return {
      ok: true,
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async approve(orderNo: string, operatorId: string, remark?: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(PaymentOrder, {
        where: { orderNo },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Payment order not found');
      if (!['pending', 'processing'].includes(order.status)) {
        throw new BadRequestException(`Order status ${order.status} cannot be approved`);
      }

      if (order.type === 'deposit') {
        const user = await manager.findOne(User, {
          where: { id: order.userId! },
          lock: { mode: 'pessimistic_write' },
        });
        if (!user) throw new NotFoundException('User not found');

        const before = Number(user.creditBalance);
        const amount = Number(order.amount);
        const after = before + amount;
        user.creditBalance = after.toFixed(2);
        await manager.save(User, user);

        await manager.save(CreditTransaction, manager.create(CreditTransaction, {
          userId: user.id,
          operatorId,
          amount: amount.toFixed(2),
          type: CreditTransactionType.ADD_CREDIT,
          referenceId: order.orderNo,
          remark: remark ?? 'payment deposit approved',
          balanceBefore: before.toFixed(2),
          balanceAfter: after.toFixed(2),
        }));
      }

      if (order.type === 'withdrawal') {
        const user = await manager.findOne(User, {
          where: { id: order.userId! },
          lock: { mode: 'pessimistic_write' },
        });
        if (!user) throw new NotFoundException('User not found');

        const before = Number(user.creditBalance);
        const amount = Number(order.amount);
        if (before < amount) throw new BadRequestException('Insufficient credit for withdrawal');
        const after = before - amount;
        user.creditBalance = after.toFixed(2);
        await manager.save(User, user);

        await manager.save(CreditTransaction, manager.create(CreditTransaction, {
          userId: user.id,
          operatorId,
          amount: (-amount).toFixed(2),
          type: CreditTransactionType.SUBTRACT_CREDIT,
          referenceId: order.orderNo,
          remark: remark ?? 'payment withdrawal approved',
          balanceBefore: before.toFixed(2),
          balanceAfter: after.toFixed(2),
        }));
      }

      order.status = 'completed';
      order.operatorId = operatorId;
      order.approvedAt = new Date();
      if (remark) order.remark = remark;
      await manager.save(PaymentOrder, order);

      return { ok: true, data: order, message: 'Payment approved' };
    });
  }

  async reject(orderNo: string, operatorId: string, reason?: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(PaymentOrder, {
        where: { orderNo },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Payment order not found');
      if (!['pending', 'processing'].includes(order.status)) {
        throw new BadRequestException(`Order status ${order.status} cannot be rejected`);
      }

      order.status = 'rejected';
      order.operatorId = operatorId;
      order.remark = reason ?? order.remark;
      await manager.save(PaymentOrder, order);

      return { ok: true, data: order, message: 'Payment rejected' };
    });
  }

  private verifyCallbackSignature(payload: any, signature?: string) {
    const secret = process.env.PAYMENT_CALLBACK_SECRET;
    if (!secret) return;

    if (!signature) throw new BadRequestException('Missing callback signature');
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (expected !== signature) throw new BadRequestException('Invalid callback signature');
  }

  async callback(payload: any, signature?: string) {
    this.verifyCallbackSignature(payload, signature);

    const adapter = this.getAdapter(payload?.provider);
    const normalized = await adapter.handleCallback(payload);

    const order = await this.paymentRepo.findOne({ where: { orderNo: normalized.orderNo } });
    if (!order) throw new NotFoundException('Payment order not found');

    order.status = normalized.status as any;
    order.txHash = normalized.txHash ?? order.txHash;
    order.metaJson = {
      ...(typeof order.metaJson === 'object' && order.metaJson ? (order.metaJson as object) : {}),
      callback: normalized.meta ?? {},
    };

    await this.paymentRepo.save(order);

    return { ok: true, data: order, message: 'Payment callback processed' };
  }
}

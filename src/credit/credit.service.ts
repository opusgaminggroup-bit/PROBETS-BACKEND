import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { AdjustCreditDto } from './dto/adjust-credit.dto';
import { CreditTransactionType } from '../common/enums/credit-transaction-type.enum';

@Injectable()
export class CreditService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(CreditTransaction)
    private readonly txRepo: Repository<CreditTransaction>,
  ) {}

  async adjustCredit(dto: AdjustCreditDto) {
    return this.dataSource.transaction(async (manager) => {
      const operator = await manager.findOne(User, {
        where: { id: dto.operatorId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!operator) throw new NotFoundException('Operator not found');

      const target = await manager.findOne(User, {
        where: { id: dto.targetUserId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!target) throw new NotFoundException('Target user not found');

      if (target.parentId !== operator.id) {
        throw new ForbiddenException('Only direct upline can adjust this user credit');
      }

      const before = Number(target.creditBalance);
      const amount = Number(dto.amount);
      const delta = dto.action === 'add' ? amount : -amount;
      const after = before + delta;

      if (after < 0) throw new BadRequestException('Insufficient credit');

      target.creditBalance = after.toFixed(2);
      await manager.save(User, target);

      const tx = manager.create(CreditTransaction, {
        userId: target.id,
        operatorId: operator.id,
        amount: delta.toFixed(2),
        type:
          dto.action === 'add'
            ? CreditTransactionType.ADD_CREDIT
            : CreditTransactionType.SUBTRACT_CREDIT,
        remark: dto.remark ?? null,
        referenceId: null,
        balanceBefore: before.toFixed(2),
        balanceAfter: after.toFixed(2),
      });

      await manager.save(CreditTransaction, tx);

      return {
        ok: true,
        targetUserId: target.id,
        action: dto.action,
        amount,
        balanceBefore: before,
        balanceAfter: after,
      };
    });
  }

  listByUser(userId: string) {
    return this.txRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentOrder } from './entities/payment-order.entity';
import { User } from '../users/entities/user.entity';
import { CreditTransaction } from '../credit/entities/credit-transaction.entity';
import { CreditModule } from '../credit/credit.module';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentOrder, User, CreditTransaction]), CreditModule],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}

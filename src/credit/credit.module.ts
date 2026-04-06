import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { User } from '../users/entities/user.entity';
import { CreditController } from './credit.controller';
import { CreditService } from './credit.service';

@Module({
  imports: [TypeOrmModule.forFeature([CreditTransaction, User])],
  controllers: [CreditController],
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {}

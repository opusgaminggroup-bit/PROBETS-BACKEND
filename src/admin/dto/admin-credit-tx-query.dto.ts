import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { CreditTransactionType } from '../../common/enums/credit-transaction-type.enum';
import { PaginationQueryDto } from './admin-query.dto';

export class AdminCreditTxQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsEnum(CreditTransactionType)
  type?: CreditTransactionType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

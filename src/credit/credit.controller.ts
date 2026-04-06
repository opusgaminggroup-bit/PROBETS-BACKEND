import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreditService } from './credit.service';
import { AdjustCreditDto } from './dto/adjust-credit.dto';

@Controller('credit')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Post('adjust')
  adjust(@Body() dto: AdjustCreditDto) {
    return this.creditService.adjustCredit(dto);
  }

  @Get('transactions/:userId')
  listByUser(@Param('userId') userId: string) {
    return this.creditService.listByUser(userId);
  }
}

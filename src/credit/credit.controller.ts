import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CreditService } from './credit.service';
import { AdjustCreditDto } from './dto/adjust-credit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Request } from 'express';

@Controller('credit')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Post('adjust')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERAGENT)
  adjust(@Req() req: Request & { user?: any }, @Body() dto: AdjustCreditDto) {
    const operatorId = String(req.user?.userId ?? dto.operatorId ?? '');
    return this.creditService.adjustCredit({ ...dto, operatorId });
  }

  @Get('transactions/:userId')
  listByUser(@Param('userId') userId: string) {
    return this.creditService.listByUser(userId);
  }
}

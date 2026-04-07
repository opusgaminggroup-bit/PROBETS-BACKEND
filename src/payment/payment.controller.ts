import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApprovePaymentDto } from './dto/approve-payment.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { AssignCreditDto } from './dto/assign-credit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Request } from 'express';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('assign-credit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERAGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin/SuperAgent 给下级 assign credit' })
  assignCredit(@Req() req: Request & { user?: any }, @Body() dto: AssignCreditDto) {
    return this.paymentService.assignCredit({ ...dto, operatorId: String(req.user?.userId ?? dto.operatorId) });
  }

  @Post('orders')
  @ApiOperation({ summary: '创建充值/提现订单' })
  create(@Body() dto: CreatePaymentDto, @Query('provider') provider?: string) {
    return this.paymentService.createOrder(dto, provider);
  }

  @Get('orders')
  @ApiOperation({ summary: '查询支付订单列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'userId', required: false })
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('userId') userId?: string,
    @Query('siteKey') siteKey?: string,
  ) {
    return this.paymentService.listOrders({
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
      status,
      type,
      userId,
      siteKey,
    });
  }

  @Patch('orders/:orderNo/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERAGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '审批通过支付订单' })
  approve(@Param('orderNo') orderNo: string, @Body() dto: ApprovePaymentDto) {
    return this.paymentService.approve(orderNo, dto.operatorId, dto.remark);
  }

  @Patch('orders/:orderNo/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERAGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '驳回支付订单' })
  reject(@Param('orderNo') orderNo: string, @Body() dto: RejectPaymentDto) {
    return this.paymentService.reject(orderNo, dto.operatorId, dto.reason);
  }

  @Post('callback')
  @ApiOperation({ summary: 'Payment provider callback' })
  callback(@Body() payload: any, @Headers('x-payment-signature') signature?: string) {
    return this.paymentService.callback(payload, signature);
  }
}

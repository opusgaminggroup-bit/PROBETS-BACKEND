import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminCreditTxQueryDto } from './dto/admin-credit-tx-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdjustCreditDto } from '../credit/dto/adjust-credit.dto';
import { AdminBetsQueryDto } from './dto/admin-bets-query.dto';
import { SettleBetDto } from '../bets/dto/settle-bet.dto';
import { AdminDashboardQueryDto } from './dto/admin-dashboard-query.dto';
import { AdminSportsQueueActionDto } from './dto/admin-sports-queue-action.dto';
import { UpsertLiveGameConfigDto } from '../live-casino/dto/upsert-live-game-config.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERAGENT)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: '分页查询用户/代理' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'parentId', required: false })
  @ApiQuery({ name: 'username', required: false })
  @ApiQuery({ name: 'minCreditBalance', required: false })
  @ApiQuery({ name: 'maxCreditBalance', required: false })
  getUsers(@Req() req: Request & { user?: any }, @Query() query: AdminUsersQueryDto) {
    return this.adminService.listUsers(req.user!, query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '查看用户详情（含下级列表与最近投注）' })
  getUserDetail(@Req() req: Request & { user?: any }, @Param('id') id: string) {
    return this.adminService.getUserDetail(req.user!, id);
  }

  @Get('agents/tree')
  @ApiOperation({ summary: '代理层级树' })
  getAgentTree(@Req() req: Request & { user?: any }) {
    return this.adminService.getAgentTree(req.user!);
  }

  @Post('users')
  @ApiOperation({ summary: '创建用户/代理' })
  createUser(@Req() req: Request & { user?: any }, @Body() dto: CreateUserDto) {
    return this.adminService.createUser(req.user!, dto);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: '启用/禁用用户' })
  updateUserStatus(
    @Req() req: Request & { user?: any },
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(req.user!, id, dto.enabled);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: '更新用户状态、creditLimit、parentId' })
  updateUser(
    @Req() req: Request & { user?: any },
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(req.user!, id, dto);
  }

  @Post('credit/adjust')
  @ApiOperation({ summary: 'Admin 信用调整（封装 /credit/adjust）' })
  adjustCredit(@Req() req: Request & { user?: any }, @Body() dto: AdjustCreditDto) {
    return this.adminService.adminCreditAdjust(req.user!, dto);
  }

  @Get('credit/transactions')
  @ApiOperation({ summary: '全局信用流水查询' })
  getCreditTransactions(
    @Req() req: Request & { user?: any },
    @Query() query: AdminCreditTxQueryDto,
  ) {
    return this.adminService.listCreditTransactions(req.user!, query);
  }

  @Get('bets')
  @ApiOperation({ summary: '投注记录查询（sports/dice/plinko/baccarat/live-casino）' })
  getBets(@Req() req: Request & { user?: any }, @Query() query: AdminBetsQueryDto) {
    return this.adminService.listBets(req.user!, query);
  }

  @Get('bets/:betNo')
  @ApiOperation({ summary: '单笔投注详情' })
  getBet(@Req() req: Request & { user?: any }, @Param('betNo') betNo: string) {
    return this.adminService.getBetByNo(req.user!, betNo);
  }

  @Post('bets/:betNo/settle')
  @ApiOperation({ summary: '手动结算（含 live-casino 争议单）' })
  settleBet(
    @Req() req: Request & { user?: any },
    @Param('betNo') betNo: string,
    @Body() dto: SettleBetDto,
  ) {
    return this.adminService.settleBet(req.user!, betNo, dto);
  }

  @Get('live-casino/games')
  @ApiOperation({ summary: '管理 Live Casino 游戏列表' })
  getLiveCasinoGames(
    @Req() req: Request & { user?: any },
    @Query('provider') provider?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listLiveCasinoGames(
      req.user!,
      provider,
      category,
      Number(page ?? 1),
      Number(limit ?? 20),
    );
  }

  @Patch('live-casino/games')
  @ApiOperation({ summary: 'Live Casino 游戏上下架与排序' })
  upsertLiveCasinoGameConfig(
    @Req() req: Request & { user?: any },
    @Body() dto: UpsertLiveGameConfigDto,
  ) {
    return this.adminService.upsertLiveCasinoGameConfig(req.user!, dto);
  }

  @Get('live-casino/sessions')
  @ApiOperation({ summary: 'Live Casino 活跃会话' })
  getLiveCasinoSessions(
    @Req() req: Request & { user?: any },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listLiveCasinoSessions(req.user!, Number(page ?? 1), Number(limit ?? 20));
  }

  @Get('live-casino/providers')
  @ApiOperation({ summary: 'Live Casino provider 列表与状态' })
  getLiveCasinoProviders(@Req() req: Request & { user?: any }) {
    return this.adminService.getLiveCasinoProviders(req.user!);
  }

  @Get('live-casino/stats')
  @ApiOperation({ summary: 'Live Casino 统计（GGR、投注额、热门桌台）' })
  getLiveCasinoStats(@Req() req: Request & { user?: any }) {
    return this.adminService.getLiveCasinoStats(req.user!);
  }

  @Get('dashboard')
  @ApiOperation({ summary: '总览仪表盘（Sports+Live Casino）' })
  dashboard(@Req() req: Request & { user?: any }, @Query() query: AdminDashboardQueryDto) {
    return this.adminService.getSportsDashboard(req.user!, Number(query.days ?? 7));
  }

  @Get('sports/dashboard')
  @ApiOperation({ summary: 'Sports 风控综合仪表盘' })
  getSportsDashboard(@Req() req: Request & { user?: any }, @Query() query: AdminDashboardQueryDto) {
    return this.adminService.getSportsDashboard(req.user!, Number(query.days ?? 7));
  }

  @Get('sports/exposure')
  @ApiOperation({ summary: '当前风险暴露（按 event/market 分组）' })
  getSportsExposure(@Req() req: Request & { user?: any }) {
    return this.adminService.getSportsExposure(req.user!);
  }

  @Get('sports/queue')
  @ApiOperation({ summary: 'Sports live queue 列表' })
  getSportsQueue(@Req() req: Request & { user?: any }, @Query('status') status?: string) {
    return this.adminService.listSportsQueue(req.user!, status);
  }

  @Post('sports/queue/action')
  @ApiOperation({ summary: 'Sports queue 管理动作（pause/retry/cancel）' })
  sportsQueueAction(
    @Req() req: Request & { user?: any },
    @Body() dto: AdminSportsQueueActionDto,
  ) {
    return this.adminService.sportsQueueAction(req.user!, dto.action, {
      queueId: dto.queueId,
      minutes: dto.minutes,
    });
  }

  @Get('reports/ggr')
  @ApiOperation({ summary: 'GGR 报表（按日期/游戏类型）' })
  reportGgr(
    @Req() req: Request & { user?: any },
    @Query('days') days?: string,
    @Query('gameType') gameType?: string,
  ) {
    return this.adminService.reportGgr(req.user!, Number(days ?? 7), gameType);
  }

  @Get('reports/agent')
  @ApiOperation({ summary: '代理业绩报表（放分/回收/净值）' })
  reportAgent(@Req() req: Request & { user?: any }, @Query('days') days?: string) {
    return this.adminService.reportAgent(req.user!, Number(days ?? 7));
  }
}

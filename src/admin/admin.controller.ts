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
  getUsers(@Req() req: Request & { user?: any }, @Query() query: AdminUsersQueryDto) {
    return this.adminService.listUsers(req.user!, query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '查看用户详情（含下级数与最近投注）' })
  getUserDetail(@Req() req: Request & { user?: any }, @Param('id') id: string) {
    return this.adminService.getUserDetail(req.user!, id);
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

  @Get('credit/transactions')
  @ApiOperation({ summary: '全局信用流水查询' })
  getCreditTransactions(
    @Req() req: Request & { user?: any },
    @Query() query: AdminCreditTxQueryDto,
  ) {
    return this.adminService.listCreditTransactions(req.user!, query);
  }

  @Get('sports/dashboard')
  @ApiOperation({ summary: 'Sports 风控综合仪表盘' })
  getSportsDashboard(@Req() req: Request & { user?: any }) {
    return this.adminService.getSportsDashboard(req.user!);
  }

  @Get('sports/exposure')
  @ApiOperation({ summary: '当前风险暴露（按 event/market 分组）' })
  getSportsExposure(@Req() req: Request & { user?: any }) {
    return this.adminService.getSportsExposure(req.user!);
  }
}

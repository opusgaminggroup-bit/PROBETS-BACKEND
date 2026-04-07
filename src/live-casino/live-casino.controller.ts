import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LiveCasinoService } from './live-casino.service';
import { LiveCasinoGamesQueryDto } from './dto/live-casino-query.dto';
import { LaunchGameDto } from './dto/launch-game.dto';

@ApiTags('live-casino')
@Controller('live-casino')
export class LiveCasinoController {
  constructor(private readonly liveCasinoService: LiveCasinoService) {}

  @Get('games')
  @ApiOperation({ summary: '获取 Live Casino 游戏列表' })
  @ApiQuery({ name: 'provider', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  games(@Query() query: LiveCasinoGamesQueryDto) {
    return this.liveCasinoService.listGames(query);
  }

  @Get('games/:gameId/launch')
  @ApiOperation({ summary: '生成游戏启动 URL' })
  launch(@Param('gameId') gameId: string, @Query() query: LaunchGameDto) {
    return this.liveCasinoService.launchGame({ ...query, gameId });
  }

  @Post('callback')
  @ApiOperation({ summary: '接收 provider bet/settle/cancel 回调' })
  callback(@Body() payload: any, @Headers('x-live-signature') signature?: string) {
    return this.liveCasinoService.handleCallback(payload, signature);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: '查询游戏会话状态' })
  session(@Param('sessionId') sessionId: string) {
    return this.liveCasinoService.getSession(sessionId);
  }

  @Get('balance')
  @ApiOperation({ summary: '查询用户在 provider 余额（可选）' })
  balance(@Query('userId') userId: string, @Query('provider') provider?: string) {
    return this.liveCasinoService.getBalance(userId, provider);
  }
}

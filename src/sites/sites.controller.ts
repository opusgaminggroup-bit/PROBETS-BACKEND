import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SitesService } from './sites.service';
import { UpsertSiteConfigDto } from './dto/upsert-site-config.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('sites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  @ApiOperation({ summary: 'Site configs list' })
  list() {
    return this.sitesService.list();
  }

  @Post('upsert')
  @ApiOperation({ summary: 'Create/update site config' })
  upsert(@Body() dto: UpsertSiteConfigDto) {
    return this.sitesService.upsert(dto);
  }
}

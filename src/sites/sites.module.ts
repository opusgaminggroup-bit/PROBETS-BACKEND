import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteConfig } from './entities/site-config.entity';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiteConfig])],
  providers: [SitesService],
  controllers: [SitesController],
  exports: [SitesService, TypeOrmModule],
})
export class SitesModule {}

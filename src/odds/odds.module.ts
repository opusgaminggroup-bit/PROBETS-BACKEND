import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OddsService } from './odds.service';
import { OddsController } from './odds.controller';
import { EventEntity } from '../events/entities/event.entity';
import { OddsSyncService } from './odds-sync.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([EventEntity])],
  controllers: [OddsController],
  providers: [OddsService, OddsSyncService],
  exports: [OddsService, TypeOrmModule],
})
export class OddsModule {}

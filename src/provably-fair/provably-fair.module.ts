import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvablyFairService } from './provably-fair.service';
import { FairSeedState } from './entities/fair-seed-state.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FairSeedState])],
  providers: [ProvablyFairService],
  exports: [ProvablyFairService, TypeOrmModule],
})
export class ProvablyFairModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { CreditModule } from './credit/credit.module';
import { BetsModule } from './bets/bets.module';
import { OddsModule } from './odds/odds.module';
import { AdminModule } from './admin/admin.module';
import { LiveCasinoModule } from './live-casino/live-casino.module';
import { PaymentModule } from './payment/payment.module';
import { SitesModule } from './sites/sites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USER', 'root'),
        password: config.get<string>('DB_PASS', ''),
        database: config.get<string>('DB_NAME', 'probets_credit'),
        autoLoadEntities: true,
        synchronize: false,
        timezone: 'Z',
      }),
    }),
    UsersModule,
    CreditModule,
    OddsModule,
    BetsModule,
    SitesModule,
    LiveCasinoModule,
    PaymentModule,
    AdminModule,
  ],
})
export class AppModule {}

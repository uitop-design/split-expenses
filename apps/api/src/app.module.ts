import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE, RouterModule } from '@nestjs/core';
import { BalancesModule } from './balances/balances.module.js';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter.js';
import { AppValidationPipe } from './common/validation/zod-validation.pipe.js';
import { ConfigModule } from './config/config.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { GroupsModule } from './groups/groups.module.js';
import { HealthModule } from './health/health.module.js';
import { MembersModule } from './members/members.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SettlementsModule } from './settlements/settlements.module.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    GroupsModule,
    MembersModule,
    ExpensesModule,
    SettlementsModule,
    BalancesModule,
    HealthModule,
    RouterModule.register([
      {
        path: 'api',
        children: [
          GroupsModule,
          MembersModule,
          ExpensesModule,
          SettlementsModule,
          BalancesModule,
          HealthModule,
        ],
      },
    ]),
  ],
  providers: [
    { provide: APP_PIPE, useClass: AppValidationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}

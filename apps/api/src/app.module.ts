import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE, RouterModule } from '@nestjs/core';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter.js';
import { AppValidationPipe } from './common/validation/zod-validation.pipe.js';
import { ConfigModule } from './config/config.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    HealthModule,
    RouterModule.register([{ path: 'api', children: [HealthModule] }]),
  ],
  providers: [
    { provide: APP_PIPE, useClass: AppValidationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}

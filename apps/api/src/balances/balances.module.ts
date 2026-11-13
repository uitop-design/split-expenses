import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module.js';
import { BalancesController } from './balances.controller.js';
import { BalancesService } from './balances.service.js';

@Module({
  imports: [GroupsModule],
  controllers: [BalancesController],
  providers: [BalancesService],
})
export class BalancesModule {}

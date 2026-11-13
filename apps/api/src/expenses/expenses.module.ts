import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module.js';
import { MembersModule } from '../members/members.module.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';

@Module({
  imports: [GroupsModule, MembersModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}

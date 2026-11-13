import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module.js';
import { MembersModule } from '../members/members.module.js';
import { SettlementsController } from './settlements.controller.js';
import { SettlementsService } from './settlements.service.js';

@Module({
  imports: [GroupsModule, MembersModule],
  controllers: [SettlementsController],
  providers: [SettlementsService],
})
export class SettlementsModule {}

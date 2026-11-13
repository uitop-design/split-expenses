import { Injectable } from '@nestjs/common';
import type { Settlement } from '../generated/prisma/client.js';
import { GroupsService } from '../groups/groups.service.js';
import { MembersService } from '../members/members.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSettlementDto } from './dto/settlement.dto.js';

@Injectable()
export class SettlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groups: GroupsService,
    private readonly members: MembersService,
  ) {}

  async create(groupId: string, dto: CreateSettlementDto): Promise<Settlement> {
    await this.groups.requireGroup(groupId);
    await this.members.assertMembersOfGroup(groupId, [dto.fromMemberId, dto.toMemberId]);
    return this.prisma.settlement.create({
      data: {
        groupId,
        fromMemberId: dto.fromMemberId,
        toMemberId: dto.toMemberId,
        amount: dto.amount,
      },
    });
  }

  async list(groupId: string): Promise<Settlement[]> {
    await this.groups.requireGroup(groupId);
    return this.prisma.settlement.findMany({
      where: { groupId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }
}

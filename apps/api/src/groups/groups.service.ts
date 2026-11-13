import { Injectable, NotFoundException } from '@nestjs/common';
import type { Group, Member } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateGroupDto, UpdateGroupDto } from './dto/group.dto.js';

export type GroupDetails = Group & { members: Member[] };

export type GroupSummary = Group & { membersCount: number; totalSpent: number };

export const memberOrder = [{ createdAt: 'asc' as const }, { id: 'asc' as const }];

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateGroupDto): Promise<GroupDetails> {
    return this.prisma.group.create({
      data: {
        name: dto.name,
        currency: dto.currency,
        members: { create: dto.members.map((name) => ({ name })) },
      },
      include: { members: { orderBy: memberOrder } },
    });
  }

  async list(): Promise<GroupSummary[]> {
    const groups = await this.prisma.group.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { _count: { select: { members: true } } },
    });
    const totals = await this.prisma.expense.groupBy({
      by: ['groupId'],
      where: { groupId: { in: groups.map((group) => group.id) } },
      _sum: { amount: true },
    });
    const totalByGroup = new Map(totals.map((row) => [row.groupId, row._sum.amount ?? 0]));
    return groups.map(({ _count, ...group }) => ({
      ...group,
      membersCount: _count.members,
      totalSpent: totalByGroup.get(group.id) ?? 0,
    }));
  }

  async get(id: string): Promise<GroupDetails> {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { members: { orderBy: memberOrder } },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async update(id: string, dto: UpdateGroupDto): Promise<GroupDetails> {
    await this.requireGroup(id);
    return this.prisma.group.update({
      where: { id },
      data: { name: dto.name },
      include: { members: { orderBy: memberOrder } },
    });
  }

  async remove(id: string): Promise<void> {
    const { count } = await this.prisma.group.deleteMany({ where: { id } });
    if (count === 0) {
      throw new NotFoundException('Group not found');
    }
  }

  async requireGroup(id: string): Promise<Group> {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }
}

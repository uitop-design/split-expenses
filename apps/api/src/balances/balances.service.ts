import { Injectable } from '@nestjs/common';
import { GroupsService, memberOrder } from '../groups/groups.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  computeBalances,
  type MemberBalance,
  suggestTransfers,
  type Transfer,
} from './balance-calculator.js';

export interface GroupBalances {
  balances: MemberBalance[];
  transfers: Transfer[];
}

@Injectable()
export class BalancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groups: GroupsService,
  ) {}

  async get(groupId: string): Promise<GroupBalances> {
    await this.groups.requireGroup(groupId);
    const [members, paid, owed, settlements] = await this.prisma.$transaction([
      this.prisma.member.findMany({
        where: { groupId },
        orderBy: memberOrder,
        select: { id: true, name: true },
      }),
      this.prisma.expense.groupBy({
        by: ['paidById'],
        where: { groupId },
        orderBy: { paidById: 'asc' },
        _sum: { amount: true },
      }),
      this.prisma.expenseShare.groupBy({
        by: ['memberId'],
        where: { expense: { groupId } },
        orderBy: { memberId: 'asc' },
        _sum: { amount: true },
      }),
      this.prisma.settlement.findMany({
        where: { groupId },
        select: { fromMemberId: true, toMemberId: true, amount: true },
      }),
    ]);
    const balances = computeBalances({
      members,
      paid: paid.map((row) => ({ memberId: row.paidById, amount: row._sum?.amount ?? 0 })),
      owed: owed.map((row) => ({ memberId: row.memberId, amount: row._sum?.amount ?? 0 })),
      settlements,
    });
    return { balances, transfers: suggestTransfers(balances) };
  }
}

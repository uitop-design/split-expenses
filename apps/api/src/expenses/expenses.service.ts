import { Injectable, NotFoundException } from '@nestjs/common';
import type { Page } from '../common/dto/pagination.dto.js';
import { fromDbDate, toDbDate } from '../common/schemas/calendar-date.schema.js';
import type { Expense, ExpenseShare } from '../generated/prisma/client.js';
import { GroupsService } from '../groups/groups.service.js';
import { MembersService } from '../members/members.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateExpenseDto, ListExpensesQueryDto } from './dto/expense.dto.js';
import { resolveShares, type Share, splitMemberIds } from './split.js';

export interface ExpenseView {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidById: string;
  spentAt: string;
  createdAt: Date;
  shares: Share[];
}

const sharesInclude = {
  shares: {
    select: { memberId: true, amount: true },
    orderBy: [{ member: { createdAt: 'asc' as const } }, { memberId: 'asc' as const }],
  },
};

function toView({ shares, spentAt, ...expense }: Expense & { shares: Share[] }): ExpenseView {
  return { ...expense, spentAt: fromDbDate(spentAt), shares };
}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groups: GroupsService,
    private readonly members: MembersService,
  ) {}

  async list(groupId: string, { page, limit }: ListExpensesQueryDto): Promise<Page<ExpenseView>> {
    await this.groups.requireGroup(groupId);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where: { groupId },
        orderBy: [{ spentAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: sharesInclude,
      }),
      this.prisma.expense.count({ where: { groupId } }),
    ]);
    return { items: items.map(toView), total, page, limit };
  }

  async create(groupId: string, dto: CreateExpenseDto): Promise<ExpenseView> {
    await this.groups.requireGroup(groupId);
    await this.members.assertMembersOfGroup(groupId, [dto.paidById, ...splitMemberIds(dto.split)]);
    const shares: Omit<ExpenseShare, 'expenseId'>[] = resolveShares(dto.amount, dto.split);
    const expense = await this.prisma.expense.create({
      data: {
        groupId,
        description: dto.description,
        amount: dto.amount,
        paidById: dto.paidById,
        spentAt: toDbDate(dto.spentAt),
        shares: { createMany: { data: shares } },
      },
      include: sharesInclude,
    });
    return toView(expense);
  }

  async remove(groupId: string, expenseId: string): Promise<void> {
    const { count } = await this.prisma.expense.deleteMany({ where: { id: expenseId, groupId } });
    if (count === 0) {
      throw new NotFoundException('Expense not found in this group');
    }
  }
}

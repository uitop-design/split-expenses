import { beforeEach, describe, expect, it } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GroupsService } from '../groups/groups.service.js';
import { MembersService } from '../members/members.service.js';
import { ANN, BOB, buildGroup, CAT, createPrismaMock, GROUP_ID, STRANGER } from '../test/mocks.js';
import type { CreateExpenseDto } from './dto/expense.dto.js';
import { ExpensesService } from './expenses.service.js';

function dto(overrides: Partial<CreateExpenseDto> = {}): CreateExpenseDto {
  return {
    description: 'Dinner',
    amount: 100,
    paidById: ANN,
    spentAt: '2026-11-01',
    split: { type: 'equal', memberIds: [ANN, BOB, CAT] },
    ...overrides,
  };
}

describe('ExpensesService.create', () => {
  let prisma: ReturnType<typeof createPrismaMock>['mock'];
  let service: ExpensesService;

  beforeEach(() => {
    const mocked = createPrismaMock();
    prisma = mocked.mock;
    const groups = new GroupsService(mocked.service);
    service = new ExpensesService(
      mocked.service,
      groups,
      new MembersService(mocked.service, groups),
    );
    prisma.group.findUnique.mockResolvedValue(buildGroup());
  });

  it('rejects members from another group with 400 and does not write', async () => {
    prisma.member.findMany.mockResolvedValue([{ id: ANN }, { id: BOB }]);

    const result = service.create(
      GROUP_ID,
      dto({ split: { type: 'equal', memberIds: [ANN, BOB, STRANGER] } }),
    );

    await expect(result).rejects.toThrow(BadRequestException);
    await expect(result).rejects.toThrow(`Not members of this group: ${STRANGER}`);
    expect(prisma.expense.create).not.toHaveBeenCalled();
  });

  it('rejects a payer from another group', async () => {
    prisma.member.findMany.mockResolvedValue([{ id: ANN }]);

    await expect(
      service.create(
        GROUP_ID,
        dto({ paidById: STRANGER, split: { type: 'equal', memberIds: [ANN] } }),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.member.findMany).toHaveBeenCalledWith({
      where: { groupId: GROUP_ID, id: { in: [STRANGER, ANN] } },
      select: { id: true },
    });
  });

  it('returns 404 for a missing group', async () => {
    prisma.group.findUnique.mockResolvedValue(null);

    await expect(service.create(GROUP_ID, dto())).rejects.toThrow(NotFoundException);
    expect(prisma.member.findMany).not.toHaveBeenCalled();
  });

  it('stores equal shares with the remainder and returns the date as YYYY-MM-DD', async () => {
    prisma.member.findMany.mockResolvedValue([{ id: ANN }, { id: BOB }, { id: CAT }]);
    prisma.expense.create.mockImplementation(async (args: unknown) => {
      const { data } = args as {
        data: { shares: { createMany: { data: unknown[] } }; spentAt: Date };
      };
      return {
        id: 'expense-1',
        groupId: GROUP_ID,
        description: 'Dinner',
        amount: 100,
        paidById: ANN,
        spentAt: data.spentAt,
        createdAt: new Date('2026-11-01T10:00:00Z'),
        shares: data.shares.createMany.data,
      };
    });

    const expense = await service.create(GROUP_ID, dto());

    expect(expense.spentAt).toBe('2026-11-01');
    expect(expense.shares).toEqual([
      { memberId: ANN, amount: 34 },
      { memberId: BOB, amount: 33 },
      { memberId: CAT, amount: 33 },
    ]);
  });
});

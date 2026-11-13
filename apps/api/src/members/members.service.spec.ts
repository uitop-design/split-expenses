import { beforeEach, describe, expect, it } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { GroupsService } from '../groups/groups.service.js';
import { ANN, buildGroup, createPrismaMock, GROUP_ID, prismaError } from '../test/mocks.js';
import { MembersService } from './members.service.js';

function history(counts: Partial<Record<string, number>> = {}) {
  return {
    _count: {
      paidExpenses: 0,
      shares: 0,
      sentSettlements: 0,
      receivedSettlements: 0,
      ...counts,
    },
  };
}

describe('MembersService', () => {
  let prisma: ReturnType<typeof createPrismaMock>['mock'];
  let service: MembersService;

  beforeEach(() => {
    const mocked = createPrismaMock();
    prisma = mocked.mock;
    service = new MembersService(mocked.service, new GroupsService(mocked.service));
  });

  describe('remove', () => {
    it.each([
      ['paid expenses', { paidExpenses: 2 }],
      ['shares', { shares: 1 }],
      ['sent settlements', { sentSettlements: 1 }],
      ['received settlements', { receivedSettlements: 3 }],
    ])('returns 409 for a member with %s', async (_, counts) => {
      prisma.member.findFirst.mockResolvedValue(history(counts));

      await expect(service.remove(GROUP_ID, ANN)).rejects.toThrow(ConflictException);
      expect(prisma.member.delete).not.toHaveBeenCalled();
    });

    it('deletes a member without history', async () => {
      prisma.member.findFirst.mockResolvedValue(history());
      prisma.member.delete.mockResolvedValue({});

      await service.remove(GROUP_ID, ANN);

      expect(prisma.member.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: ANN, groupId: GROUP_ID } }),
      );
      expect(prisma.member.delete).toHaveBeenCalledWith({ where: { id: ANN } });
    });

    it('returns 409 when history appears between the check and the delete', async () => {
      prisma.member.findFirst.mockResolvedValue(history());
      prisma.member.delete.mockRejectedValue(prismaError('P2003'));

      await expect(service.remove(GROUP_ID, ANN)).rejects.toThrow(ConflictException);
    });

    it('returns 404 for a member of another group', async () => {
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(service.remove(GROUP_ID, ANN)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      prisma.group.findUnique.mockResolvedValue(buildGroup());
      prisma.member.count.mockResolvedValue(3);
    });

    it('returns 409 for a duplicate name', async () => {
      prisma.member.create.mockRejectedValue(prismaError('P2002'));

      await expect(service.create(GROUP_ID, 'ann')).rejects.toThrow(
        'Member "ann" already exists in this group',
      );
    });

    it('returns 409 when the group is full', async () => {
      prisma.member.count.mockResolvedValue(20);

      await expect(service.create(GROUP_ID, 'Eve')).rejects.toThrow(ConflictException);
      expect(prisma.member.create).not.toHaveBeenCalled();
    });
  });
});

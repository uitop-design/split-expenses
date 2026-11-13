import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isPrismaError, PrismaErrorCode } from '../common/errors/prisma-errors.js';
import type { Member } from '../generated/prisma/client.js';
import { MAX_MEMBERS } from '../groups/dto/group.schemas.js';
import { GroupsService } from '../groups/groups.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const MEMBER_HAS_HISTORY = 'Member has expenses, shares or settlements and cannot be removed';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groups: GroupsService,
  ) {}

  async create(groupId: string, name: string): Promise<Member> {
    await this.groups.requireGroup(groupId);
    const count = await this.prisma.member.count({ where: { groupId } });
    if (count >= MAX_MEMBERS) {
      throw new ConflictException(`A group can have at most ${MAX_MEMBERS} members`);
    }
    try {
      return await this.prisma.member.create({ data: { groupId, name } });
    } catch (error) {
      if (isPrismaError(error, PrismaErrorCode.UniqueViolation)) {
        throw new ConflictException(`Member "${name}" already exists in this group`);
      }
      throw error;
    }
  }

  async remove(groupId: string, memberId: string): Promise<void> {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, groupId },
      select: {
        _count: {
          select: {
            paidExpenses: true,
            shares: true,
            sentSettlements: true,
            receivedSettlements: true,
          },
        },
      },
    });
    if (!member) {
      throw new NotFoundException('Member not found in this group');
    }
    if (Object.values(member._count).some((count) => count > 0)) {
      throw new ConflictException(MEMBER_HAS_HISTORY);
    }
    try {
      await this.prisma.member.delete({ where: { id: memberId } });
    } catch (error) {
      if (isPrismaError(error, PrismaErrorCode.ForeignKeyViolation)) {
        throw new ConflictException(MEMBER_HAS_HISTORY);
      }
      throw error;
    }
  }

  async assertMembersOfGroup(groupId: string, memberIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(memberIds)];
    const found = await this.prisma.member.findMany({
      where: { groupId, id: { in: uniqueIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((member) => member.id));
    const missing = uniqueIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(`Not members of this group: ${missing.join(', ')}`);
    }
  }
}

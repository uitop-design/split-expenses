import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../common/swagger/api-error-responses.decorator.js';
import type { Member } from '../generated/prisma/client.js';
import { GroupParamDto } from '../groups/dto/group.dto.js';
import { CreateMemberDto, MemberDto, MemberParamDto } from './dto/member.dto.js';
import { MembersService } from './members.service.js';

@ApiTags('members')
@Controller('groups/:id/members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Post()
  @ApiOperation({ summary: 'Add a member to a group' })
  @ApiCreatedResponse({ type: MemberDto })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND, HttpStatus.CONFLICT)
  create(@Param() { id }: GroupParamDto, @Body() dto: CreateMemberDto): Promise<Member> {
    return this.members.create(id, dto.name);
  }

  @Delete(':memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member without expenses, shares or settlements' })
  @ApiNoContentResponse()
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND, HttpStatus.CONFLICT)
  remove(@Param() { id, memberId }: MemberParamDto): Promise<void> {
    return this.members.remove(id, memberId);
  }
}

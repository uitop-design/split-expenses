import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorResponses } from '../common/swagger/api-error-responses.decorator.js';
import {
  CreateGroupDto,
  GroupDetailsDto,
  GroupParamDto,
  GroupSummaryDto,
  UpdateGroupDto,
} from './dto/group.dto.js';
import { type GroupDetails, type GroupSummary, GroupsService } from './groups.service.js';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a group with its initial members' })
  @ApiCreatedResponse({ type: GroupDetailsDto })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST)
  create(@Body() dto: CreateGroupDto): Promise<GroupDetails> {
    return this.groups.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List groups, newest first, with member count and total spent' })
  @ApiOkResponse({ type: GroupSummaryDto, isArray: true })
  list(): Promise<GroupSummary[]> {
    return this.groups.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a group with its members' })
  @ApiOkResponse({ type: GroupDetailsDto })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  get(@Param() { id }: GroupParamDto): Promise<GroupDetails> {
    return this.groups.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a group' })
  @ApiOkResponse({ type: GroupDetailsDto })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  update(@Param() { id }: GroupParamDto, @Body() dto: UpdateGroupDto): Promise<GroupDetails> {
    return this.groups.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a group with all its members, expenses and settlements' })
  @ApiNoContentResponse()
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  remove(@Param() { id }: GroupParamDto): Promise<void> {
    return this.groups.remove(id);
  }
}

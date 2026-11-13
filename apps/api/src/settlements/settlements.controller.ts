import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../common/swagger/api-error-responses.decorator.js';
import type { Settlement } from '../generated/prisma/client.js';
import { GroupParamDto } from '../groups/dto/group.dto.js';
import { CreateSettlementDto, SettlementDto } from './dto/settlement.dto.js';
import { SettlementsService } from './settlements.service.js';

@ApiTags('settlements')
@Controller('groups/:id/settlements')
export class SettlementsController {
  constructor(private readonly settlements: SettlementsService) {}

  @Post()
  @ApiOperation({
    summary: 'Record a transfer between two members',
    description: 'Overpaying is allowed: the balance simply moves to the other side.',
  })
  @ApiCreatedResponse({ type: SettlementDto })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  create(@Param() { id }: GroupParamDto, @Body() dto: CreateSettlementDto): Promise<Settlement> {
    return this.settlements.create(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List settlements, newest first' })
  @ApiOkResponse({ type: SettlementDto, isArray: true })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  list(@Param() { id }: GroupParamDto): Promise<Settlement[]> {
    return this.settlements.list(id);
  }
}

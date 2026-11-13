import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../common/swagger/api-error-responses.decorator.js';
import { GroupParamDto } from '../groups/dto/group.dto.js';
import { BalancesService, type GroupBalances } from './balances.service.js';
import { GroupBalancesDto } from './dto/balances.dto.js';

@ApiTags('balances')
@Controller('groups/:id/balances')
export class BalancesController {
  constructor(private readonly balances: BalancesService) {}

  @Get()
  @ApiOperation({
    summary: 'Member balances and suggested transfers to settle up',
    description:
      'Balance = paid - own shares + sent settlements - received settlements; balances add up ' +
      'to zero. Transfers are built greedily: the largest debtor pays the largest creditor.',
  })
  @ApiOkResponse({ type: GroupBalancesDto })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  get(@Param() { id }: GroupParamDto): Promise<GroupBalances> {
    return this.balances.get(id);
  }
}

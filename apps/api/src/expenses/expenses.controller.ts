import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Page } from '../common/dto/pagination.dto.js';
import { ApiErrorResponses } from '../common/swagger/api-error-responses.decorator.js';
import { GroupParamDto } from '../groups/dto/group.dto.js';
import {
  CreateExpenseDto,
  ExpenseDto,
  ExpensePageDto,
  ExpenseParamDto,
  ListExpensesQueryDto,
} from './dto/expense.dto.js';
import { ExpensesService, type ExpenseView } from './expenses.service.js';

@ApiTags('expenses')
@Controller('groups/:id/expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List expenses with shares, newest first' })
  @ApiOkResponse({ type: ExpensePageDto })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  list(
    @Param() { id }: GroupParamDto,
    @Query() query: ListExpensesQueryDto,
  ): Promise<Page<ExpenseView>> {
    return this.expenses.list(id, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Add an expense',
    description:
      'Split "equal" divides the amount between the listed members, leftover minor units go ' +
      'one by one to the first members. Split "exact" takes explicit shares that must add up ' +
      'to the amount.',
  })
  @ApiCreatedResponse({ type: ExpenseDto })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  create(@Param() { id }: GroupParamDto, @Body() dto: CreateExpenseDto): Promise<ExpenseView> {
    return this.expenses.create(id, dto);
  }

  @Delete(':expenseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiNoContentResponse()
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  remove(@Param() { id, expenseId }: ExpenseParamDto): Promise<void> {
    return this.expenses.remove(id, expenseId);
  }
}

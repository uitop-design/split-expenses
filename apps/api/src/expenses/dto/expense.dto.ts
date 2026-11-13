import { createZodDto } from 'nestjs-zod';
import { pageSchema } from '../../common/dto/pagination.dto.js';
import {
  createExpenseSchema,
  expenseParamSchema,
  expenseSchema,
  listExpensesQuerySchema,
} from './expense.schemas.js';

export class CreateExpenseDto extends createZodDto(createExpenseSchema) {}

export class ListExpensesQueryDto extends createZodDto(listExpensesQuerySchema) {}

export class ExpenseParamDto extends createZodDto(expenseParamSchema) {}

export class ExpenseDto extends createZodDto(expenseSchema) {}

export class ExpensePageDto extends createZodDto(pageSchema(expenseSchema)) {}

import { z } from 'zod';
import { limitQuerySchema, pageQuerySchema } from '../../common/dto/pagination.dto.js';
import { calendarDateSchema } from '../../common/schemas/calendar-date.schema.js';
import { groupParamSchema, hasNoDuplicates, idSchema } from '../../common/schemas/id.schema.js';
import { amountSchema } from '../../common/schemas/money.schema.js';
import { MAX_MEMBERS } from '../../groups/dto/group.schemas.js';
import { sumAmounts } from '../split.js';

const shareSchema = z.strictObject({
  memberId: idSchema,
  amount: amountSchema,
});

const equalSplitSchema = z.strictObject({
  type: z.literal('equal'),
  memberIds: z
    .array(idSchema)
    .min(1)
    .max(MAX_MEMBERS)
    .refine(hasNoDuplicates, 'must not contain duplicate members')
    .describe('Members sharing the expense; leftover minor units go to the first ones'),
});

const exactSplitSchema = z.strictObject({
  type: z.literal('exact'),
  shares: z
    .array(shareSchema)
    .min(1)
    .max(MAX_MEMBERS)
    .refine(
      (shares) => hasNoDuplicates(shares.map((share) => share.memberId)),
      'must not contain duplicate members',
    )
    .describe('Exact share of every member; shares must add up to the expense amount'),
});

export const splitSchema = z.discriminatedUnion('type', [equalSplitSchema, exactSplitSchema]);

export const createExpenseSchema = z
  .strictObject({
    description: z.string().trim().min(1).max(120),
    amount: amountSchema,
    paidById: idSchema.describe('Member who paid; does not have to take part in the split'),
    spentAt: calendarDateSchema.describe('Date of the expense, YYYY-MM-DD, not in the future'),
    split: splitSchema,
  })
  .superRefine(({ amount, split }, ctx) => {
    if (split.type === 'equal' && amount < split.memberIds.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['amount'],
        message: `must be at least ${split.memberIds.length} to split between ${split.memberIds.length} members`,
      });
    }
    if (split.type === 'exact') {
      const total = sumAmounts(split.shares);
      if (total !== amount) {
        ctx.addIssue({
          code: 'custom',
          path: ['split', 'shares'],
          message: `must add up to the expense amount ${amount}, got ${total}`,
        });
      }
    }
  });

export const listExpensesQuerySchema = z.object({
  page: pageQuerySchema,
  limit: limitQuerySchema,
});

export const expenseParamSchema = groupParamSchema.extend({
  expenseId: idSchema.describe('Expense id'),
});

export const expenseSchema = z.object({
  id: idSchema,
  groupId: idSchema,
  description: z.string(),
  amount: z.int(),
  paidById: idSchema,
  spentAt: z.iso.date(),
  createdAt: z.iso.datetime(),
  shares: z.array(z.object({ memberId: idSchema, amount: z.int() })),
});

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { idSchema } from '../../common/schemas/id.schema.js';

export const groupBalancesSchema = z.object({
  balances: z.array(
    z.object({
      memberId: idSchema,
      name: z.string(),
      balance: z
        .int()
        .describe('Positive: the group owes this member; negative: the member owes the group'),
    }),
  ),
  transfers: z.array(
    z.object({ fromMemberId: idSchema, toMemberId: idSchema, amount: z.int().min(1) }),
  ),
});

export class GroupBalancesDto extends createZodDto(groupBalancesSchema) {}

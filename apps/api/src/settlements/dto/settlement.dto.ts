import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { idSchema } from '../../common/schemas/id.schema.js';
import { amountSchema } from '../../common/schemas/money.schema.js';

export const createSettlementSchema = z
  .strictObject({
    fromMemberId: idSchema.describe('Member who pays the debt back'),
    toMemberId: idSchema.describe('Member who receives the money'),
    amount: amountSchema,
  })
  .refine((body) => body.fromMemberId !== body.toMemberId, {
    path: ['toMemberId'],
    message: 'must differ from fromMemberId',
  });

export const settlementSchema = z.object({
  id: idSchema,
  groupId: idSchema,
  fromMemberId: idSchema,
  toMemberId: idSchema,
  amount: z.int(),
  createdAt: z.iso.datetime(),
});

export class CreateSettlementDto extends createZodDto(createSettlementSchema) {}

export class SettlementDto extends createZodDto(settlementSchema) {}

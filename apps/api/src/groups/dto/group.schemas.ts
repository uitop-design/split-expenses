import { z } from 'zod';
import { idSchema } from '../../common/schemas/id.schema.js';

export const MAX_MEMBERS = 20;

const SUPPORTED_CURRENCIES = new Set(Intl.supportedValuesOf('currency'));

export const currencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'must be a 3-letter uppercase ISO 4217 code')
  .refine((code) => SUPPORTED_CURRENCIES.has(code), 'is not a known ISO 4217 currency')
  .describe('ISO 4217 currency code');

export const groupNameSchema = z.string().trim().min(2).max(64).describe('Group name');

export const memberNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .describe('Member name, unique within the group regardless of case');

export const createGroupSchema = z.strictObject({
  name: groupNameSchema,
  currency: currencySchema.default('UAH'),
  members: z
    .array(memberNameSchema)
    .min(2)
    .max(MAX_MEMBERS)
    .refine(
      (names) => new Set(names.map((name) => name.toLowerCase())).size === names.length,
      'must not contain duplicate names',
    )
    .describe('Initial members, 2 to 20 names'),
});

export const updateGroupSchema = z.strictObject({ name: groupNameSchema });

export const memberSchema = z.object({
  id: idSchema,
  groupId: idSchema,
  name: z.string(),
  createdAt: z.iso.datetime(),
});

export const groupSchema = z.object({
  id: idSchema,
  name: z.string(),
  currency: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const groupDetailsSchema = groupSchema.extend({ members: z.array(memberSchema) });

export const groupSummarySchema = groupSchema.extend({
  membersCount: z.int().min(0),
  totalSpent: z.int().min(0).describe('Sum of all expenses in minor units'),
});

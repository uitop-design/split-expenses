import { z } from 'zod';

export const memberSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  name: z.string(),
  createdAt: z.string(),
});

const groupBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const groupSummarySchema = groupBaseSchema.extend({
  membersCount: z.number(),
  totalSpent: z.number(),
});

export const groupDetailsSchema = groupBaseSchema.extend({
  members: z.array(memberSchema),
});

export const shareSchema = z.object({
  memberId: z.string(),
  amount: z.number(),
});

export const expenseSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  description: z.string(),
  amount: z.number(),
  paidById: z.string(),
  spentAt: z.string(),
  createdAt: z.string(),
  shares: z.array(shareSchema),
});

export const expensePageSchema = z.object({
  items: z.array(expenseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const settlementSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  fromMemberId: z.string(),
  toMemberId: z.string(),
  amount: z.number(),
  createdAt: z.string(),
});

export const transferSchema = z.object({
  fromMemberId: z.string(),
  toMemberId: z.string(),
  amount: z.number(),
});

export const balancesSchema = z.object({
  balances: z.array(z.object({ memberId: z.string(), name: z.string(), balance: z.number() })),
  transfers: z.array(transferSchema),
});

export const noContentSchema = z.undefined();

export type Member = z.infer<typeof memberSchema>;
export type GroupSummary = z.infer<typeof groupSummarySchema>;
export type GroupDetails = z.infer<typeof groupDetailsSchema>;
export type Expense = z.infer<typeof expenseSchema>;
export type ExpensePage = z.infer<typeof expensePageSchema>;
export type Settlement = z.infer<typeof settlementSchema>;
export type Transfer = z.infer<typeof transferSchema>;
export type Balances = z.infer<typeof balancesSchema>;

export interface CreateGroupInput {
  name: string;
  currency: string;
  members: string[];
}

export type ExpenseSplit =
  | { type: 'equal'; memberIds: string[] }
  | { type: 'exact'; shares: { memberId: string; amount: number }[] };

export interface CreateExpenseInput {
  description: string;
  amount: number;
  paidById: string;
  spentAt: string;
  split: ExpenseSplit;
}

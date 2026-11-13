import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { type Share, splitEqually, sumAmounts } from '../src/expenses/split.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

config({ quiet: true });

type SeedSplit = { equal: string[] } | { exact: Record<string, number> };

interface SeedExpense {
  description: string;
  amount: number;
  paidBy: string;
  spentAt: string;
  split: SeedSplit;
}

interface SeedSettlement {
  from: string;
  to: string;
  amount: number;
}

interface SeedGroup {
  id: string;
  name: string;
  currency: string;
  members: string[];
  expenses: SeedExpense[];
  settlements: SeedSettlement[];
}

const groups: SeedGroup[] = [
  {
    id: '019a7c2e-4b10-7000-8000-000000000001',
    name: 'Trip to Carpathians',
    currency: 'UAH',
    members: ['Olena', 'Taras', 'Iryna', 'Maksym'],
    expenses: [
      {
        description: 'Train tickets Kyiv - Ivano-Frankivsk',
        amount: 342_000,
        paidBy: 'Olena',
        spentAt: '2026-10-02',
        split: { equal: ['Olena', 'Taras', 'Iryna', 'Maksym'] },
      },
      {
        description: 'Groceries for the first days',
        amount: 187_450,
        paidBy: 'Taras',
        spentAt: '2026-10-03',
        split: { equal: ['Olena', 'Taras', 'Iryna', 'Maksym'] },
      },
      {
        description: 'Chalet in Yaremche, 3 nights',
        amount: 960_000,
        paidBy: 'Iryna',
        spentAt: '2026-10-03',
        split: { equal: ['Olena', 'Taras', 'Iryna', 'Maksym'] },
      },
      {
        description: 'Taxi to the trailhead',
        amount: 65_000,
        paidBy: 'Maksym',
        spentAt: '2026-10-04',
        split: { equal: ['Taras', 'Iryna', 'Maksym'] },
      },
      {
        description: 'Hoverla guide',
        amount: 150_000,
        paidBy: 'Olena',
        spentAt: '2026-10-04',
        split: { equal: ['Olena', 'Taras', 'Iryna', 'Maksym'] },
      },
      {
        description: 'Banosh and bryndza dinner',
        amount: 214_300,
        paidBy: 'Taras',
        spentAt: '2026-10-04',
        split: { exact: { Olena: 48_500, Taras: 61_200, Iryna: 42_100, Maksym: 62_500 } },
      },
      {
        description: 'Ski pass rental',
        amount: 120_000,
        paidBy: 'Maksym',
        spentAt: '2026-10-05',
        split: { exact: { Taras: 60_000, Maksym: 60_000 } },
      },
      {
        description: 'Souvenirs at the market',
        amount: 45_800,
        paidBy: 'Iryna',
        spentAt: '2026-10-05',
        split: { exact: { Olena: 15_800, Iryna: 30_000 } },
      },
      {
        description: 'Coffee and pastries',
        amount: 18_700,
        paidBy: 'Olena',
        spentAt: '2026-10-06',
        split: { equal: ['Olena', 'Taras', 'Iryna'] },
      },
      {
        description: 'Train tickets back to Kyiv',
        amount: 342_000,
        paidBy: 'Maksym',
        spentAt: '2026-10-06',
        split: { equal: ['Olena', 'Taras', 'Iryna', 'Maksym'] },
      },
    ],
    settlements: [{ from: 'Taras', to: 'Iryna', amount: 100_000 }],
  },
  {
    id: '019a7c2e-4b10-7000-8000-000000000002',
    name: 'Flat 12',
    currency: 'UAH',
    members: ['Anna', 'Dmytro', 'Sofiia'],
    expenses: [
      {
        description: 'Rent for October',
        amount: 2_400_000,
        paidBy: 'Anna',
        spentAt: '2026-10-01',
        split: { equal: ['Anna', 'Dmytro', 'Sofiia'] },
      },
      {
        description: 'Internet',
        amount: 30_000,
        paidBy: 'Dmytro',
        spentAt: '2026-10-05',
        split: { equal: ['Anna', 'Dmytro', 'Sofiia'] },
      },
      {
        description: 'Utilities',
        amount: 284_350,
        paidBy: 'Sofiia',
        spentAt: '2026-10-20',
        split: { equal: ['Anna', 'Dmytro', 'Sofiia'] },
      },
    ],
    settlements: [],
  },
];

function resolveShares(expense: SeedExpense, memberIds: Map<string, string>): Share[] {
  const idOf = (name: string): string => {
    const id = memberIds.get(name);
    if (!id) {
      throw new Error(`Unknown seed member "${name}"`);
    }
    return id;
  };
  if ('equal' in expense.split) {
    return splitEqually(expense.amount, expense.split.equal.map(idOf));
  }
  const shares = Object.entries(expense.split.exact).map(([name, amount]) => ({
    memberId: idOf(name),
    amount,
  }));
  if (sumAmounts(shares) !== expense.amount) {
    throw new Error(`Shares of "${expense.description}" do not add up to ${expense.amount}`);
  }
  return shares;
}

async function seedGroup(prisma: PrismaClient, seed: SeedGroup): Promise<boolean> {
  const existing = await prisma.group.findUnique({ where: { id: seed.id }, select: { id: true } });
  if (existing) {
    return false;
  }
  await prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        id: seed.id,
        name: seed.name,
        currency: seed.currency,
        members: { create: seed.members.map((name) => ({ name })) },
      },
      include: { members: true },
    });
    const memberIds = new Map(group.members.map((member) => [member.name, member.id]));
    for (const expense of seed.expenses) {
      await tx.expense.create({
        data: {
          groupId: group.id,
          description: expense.description,
          amount: expense.amount,
          paidById: memberIds.get(expense.paidBy) ?? '',
          spentAt: new Date(`${expense.spentAt}T00:00:00Z`),
          shares: { createMany: { data: resolveShares(expense, memberIds) } },
        },
      });
    }
    for (const settlement of seed.settlements) {
      await tx.settlement.create({
        data: {
          groupId: group.id,
          fromMemberId: memberIds.get(settlement.from) ?? '',
          toMemberId: memberIds.get(settlement.to) ?? '',
          amount: settlement.amount,
        },
      });
    }
  });
  return true;
}

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
    }),
  });
  try {
    for (const group of groups) {
      const created = await seedGroup(prisma, group);
      console.log(`${created ? 'Seeded' : 'Skipped existing'} group "${group.name}"`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

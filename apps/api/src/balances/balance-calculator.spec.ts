import { describe, expect, it } from '@jest/globals';
import {
  computeBalances,
  type Ledger,
  type MemberBalance,
  suggestTransfers,
  type Transfer,
} from './balance-calculator.js';

const members = [
  { id: 'a', name: 'Ann' },
  { id: 'b', name: 'Bob' },
  { id: 'c', name: 'Cat' },
  { id: 'd', name: 'Dan' },
];

function ledger(overrides: Partial<Ledger> = {}): Ledger {
  return { members, paid: [], owed: [], settlements: [], ...overrides };
}

function balance(memberId: string, name: string, value: number): MemberBalance {
  return { memberId, name, balance: value };
}

function applyTransfers(balances: MemberBalance[], transfers: Transfer[]): Map<string, number> {
  const result = new Map(balances.map((entry) => [entry.memberId, entry.balance]));
  for (const transfer of transfers) {
    result.set(transfer.fromMemberId, (result.get(transfer.fromMemberId) ?? 0) + transfer.amount);
    result.set(transfer.toMemberId, (result.get(transfer.toMemberId) ?? 0) - transfer.amount);
  }
  return result;
}

function total(balances: MemberBalance[]): number {
  return balances.reduce((sum, entry) => sum + entry.balance, 0);
}

describe('computeBalances', () => {
  it('applies paid - shares + sent - received for every member', () => {
    const balances = computeBalances(
      ledger({
        paid: [
          { memberId: 'a', amount: 300 },
          { memberId: 'b', amount: 100 },
        ],
        owed: [
          { memberId: 'a', amount: 100 },
          { memberId: 'b', amount: 100 },
          { memberId: 'c', amount: 100 },
          { memberId: 'd', amount: 100 },
        ],
        settlements: [{ fromMemberId: 'c', toMemberId: 'a', amount: 60 }],
      }),
    );

    expect(balances).toEqual([
      balance('a', 'Ann', 140),
      balance('b', 'Bob', 0),
      balance('c', 'Cat', -40),
      balance('d', 'Dan', -100),
    ]);
    expect(total(balances)).toBe(0);
  });

  it('returns zero for members without any activity', () => {
    expect(computeBalances(ledger()).every((entry) => entry.balance === 0)).toBe(true);
  });
});

describe('suggestTransfers', () => {
  it('returns nothing when everyone is settled', () => {
    expect(suggestTransfers(members.map((m) => balance(m.id, m.name, 0)))).toEqual([]);
  });

  it('lets the largest debtor pay the largest creditor first', () => {
    const balances = [
      balance('a', 'Ann', 500),
      balance('b', 'Bob', 100),
      balance('c', 'Cat', -350),
      balance('d', 'Dan', -250),
    ];

    expect(suggestTransfers(balances)).toEqual([
      { fromMemberId: 'c', toMemberId: 'a', amount: 350 },
      { fromMemberId: 'd', toMemberId: 'a', amount: 150 },
      { fromMemberId: 'd', toMemberId: 'b', amount: 100 },
    ]);
  });

  it('zeroes every balance with at most n - 1 transfers', () => {
    const values = [12_345, -5_000, 7_655, -20_000, 4_000, 1_000];
    const balances = values.map((value, index) => balance(`m${index}`, `Member ${index}`, value));
    const transfers = suggestTransfers(balances);

    expect(total(balances)).toBe(0);
    expect(transfers.length).toBeLessThanOrEqual(balances.length - 1);
    expect(transfers.every((transfer) => transfer.amount > 0)).toBe(true);
    expect([...applyTransfers(balances, transfers).values()].every((value) => value === 0)).toBe(
      true,
    );
  });

  it('settles a single debt with a single transfer', () => {
    expect(suggestTransfers([balance('a', 'Ann', 70), balance('b', 'Bob', -70)])).toEqual([
      { fromMemberId: 'b', toMemberId: 'a', amount: 70 },
    ]);
  });

  it('is deterministic and breaks ties by name regardless of input order', () => {
    const balances = [
      balance('z', 'Zoe', 100),
      balance('y', 'Adam', 100),
      balance('x', 'Mia', -100),
      balance('w', 'Bea', -100),
    ];
    const expected = [
      { fromMemberId: 'w', toMemberId: 'y', amount: 100 },
      { fromMemberId: 'x', toMemberId: 'z', amount: 100 },
    ];

    expect(suggestTransfers(balances)).toEqual(expected);
    expect(suggestTransfers([...balances].reverse())).toEqual(expected);
  });

  it('does not mutate the input balances', () => {
    const balances = [balance('a', 'Ann', 10), balance('b', 'Bob', -10)];
    const snapshot = structuredClone(balances);
    suggestTransfers(balances);
    expect(balances).toEqual(snapshot);
  });

  it('suggests a transfer back after an overpayment', () => {
    const balances = computeBalances(
      ledger({
        members: members.slice(0, 2),
        paid: [{ memberId: 'a', amount: 100 }],
        owed: [
          { memberId: 'a', amount: 50 },
          { memberId: 'b', amount: 50 },
        ],
        settlements: [{ fromMemberId: 'b', toMemberId: 'a', amount: 80 }],
      }),
    );

    expect(balances).toEqual([balance('a', 'Ann', -30), balance('b', 'Bob', 30)]);
    expect(suggestTransfers(balances)).toEqual([
      { fromMemberId: 'a', toMemberId: 'b', amount: 30 },
    ]);
  });
});

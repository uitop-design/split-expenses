import { describe, expect, it } from '@jest/globals';
import { ANN, BOB, CAT } from '../test/mocks.js';
import { createExpenseSchema } from './dto/expense.schemas.js';
import { resolveShares, splitEqually, sumAmounts } from './split.js';

const base = {
  description: 'Taxi',
  amount: 100,
  paidById: ANN,
  spentAt: '2026-11-01',
};

function issues(body: unknown): string[] {
  const result = createExpenseSchema.safeParse(body);
  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

describe('splitEqually', () => {
  it('hands out the remainder to the first members in order', () => {
    expect(splitEqually(100, [ANN, BOB, CAT])).toEqual([
      { memberId: ANN, amount: 34 },
      { memberId: BOB, amount: 33 },
      { memberId: CAT, amount: 33 },
    ]);
    expect(splitEqually(100, [CAT, BOB, ANN])[0]).toEqual({ memberId: CAT, amount: 34 });
  });

  it('gives one unit to each of the first members when the remainder is larger', () => {
    expect(splitEqually(101, [ANN, BOB, CAT]).map((share) => share.amount)).toEqual([34, 34, 33]);
  });

  it('splits evenly without a remainder', () => {
    expect(splitEqually(90, [ANN, BOB, CAT]).map((share) => share.amount)).toEqual([30, 30, 30]);
  });

  it.each([
    [1, 1],
    [7, 3],
    [100_000_000, 7],
    [99_999_999, 20],
  ])('always adds up to the amount (%i between %i)', (amount, count) => {
    const ids = Array.from({ length: count }, (_, index) => `member-${index}`);
    const shares = splitEqually(amount, ids);
    expect(sumAmounts(shares)).toBe(amount);
    const values = shares.map((share) => share.amount);
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
  });
});

describe('resolveShares', () => {
  it('keeps exact shares as they are', () => {
    const shares = [
      { memberId: ANN, amount: 70 },
      { memberId: BOB, amount: 30 },
    ];
    expect(resolveShares(100, { type: 'exact', shares })).toEqual(shares);
  });

  it('splits equal expenses', () => {
    expect(resolveShares(10, { type: 'equal', memberIds: [ANN, BOB] })).toEqual([
      { memberId: ANN, amount: 5 },
      { memberId: BOB, amount: 5 },
    ]);
  });
});

describe('createExpenseSchema split rules', () => {
  it('accepts an exact split that adds up to the amount', () => {
    const shares = [
      { memberId: ANN, amount: 60 },
      { memberId: BOB, amount: 40 },
    ];
    expect(issues({ ...base, split: { type: 'exact', shares } })).toEqual([]);
  });

  it('rejects an exact split with a wrong total', () => {
    const shares = [
      { memberId: ANN, amount: 60 },
      { memberId: BOB, amount: 30 },
    ];
    expect(issues({ ...base, split: { type: 'exact', shares } })).toEqual([
      'split.shares: must add up to the expense amount 100, got 90',
    ]);
  });

  it('rejects duplicate members in exact shares', () => {
    const shares = [
      { memberId: ANN, amount: 50 },
      { memberId: ANN, amount: 50 },
    ];
    expect(issues({ ...base, split: { type: 'exact', shares } })).toContain(
      'split.shares: must not contain duplicate members',
    );
  });

  it('rejects duplicate members in an equal split', () => {
    expect(issues({ ...base, split: { type: 'equal', memberIds: [ANN, BOB, ANN] } })).toEqual([
      'split.memberIds: must not contain duplicate members',
    ]);
  });

  it('rejects zero shares and an empty member list', () => {
    const shares = [
      { memberId: ANN, amount: 100 },
      { memberId: BOB, amount: 0 },
    ];
    expect(issues({ ...base, split: { type: 'exact', shares } })).not.toEqual([]);
    expect(issues({ ...base, split: { type: 'equal', memberIds: [] } })).not.toEqual([]);
  });

  it('rejects an amount smaller than the number of members in an equal split', () => {
    expect(
      issues({ ...base, amount: 2, split: { type: 'equal', memberIds: [ANN, BOB, CAT] } }),
    ).toEqual(['amount: must be at least 3 to split between 3 members']);
  });

  it.each([0, -1, 1.5, 100_000_001])('rejects amount %p', (amount) => {
    expect(issues({ ...base, amount, split: { type: 'equal', memberIds: [ANN] } })).not.toEqual([]);
  });
});

export interface Share {
  memberId: string;
  amount: number;
}

export type Split = { type: 'equal'; memberIds: string[] } | { type: 'exact'; shares: Share[] };

export function splitEqually(amount: number, memberIds: string[]): Share[] {
  const count = memberIds.length;
  const base = Math.floor(amount / count);
  const remainder = amount - base * count;
  return memberIds.map((memberId, index) => ({
    memberId,
    amount: base + (index < remainder ? 1 : 0),
  }));
}

export function resolveShares(amount: number, split: Split): Share[] {
  return split.type === 'equal'
    ? splitEqually(amount, split.memberIds)
    : split.shares.map(({ memberId, amount: shareAmount }) => ({ memberId, amount: shareAmount }));
}

export function splitMemberIds(split: Split): string[] {
  return split.type === 'equal' ? split.memberIds : split.shares.map((share) => share.memberId);
}

export function sumAmounts(items: { amount: number }[]): number {
  return items.reduce((total, item) => total + item.amount, 0);
}

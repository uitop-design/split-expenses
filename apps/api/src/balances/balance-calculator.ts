export interface LedgerMember {
  id: string;
  name: string;
}

export interface MemberAmount {
  memberId: string;
  amount: number;
}

export interface Transfer {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

export interface Ledger {
  members: LedgerMember[];
  paid: MemberAmount[];
  owed: MemberAmount[];
  settlements: Transfer[];
}

export interface MemberBalance {
  memberId: string;
  name: string;
  balance: number;
}

export function computeBalances({ members, paid, owed, settlements }: Ledger): MemberBalance[] {
  const totals = new Map(members.map((member) => [member.id, 0]));
  const add = (memberId: string, amount: number) => {
    const current = totals.get(memberId);
    if (current !== undefined) {
      totals.set(memberId, current + amount);
    }
  };
  for (const entry of paid) {
    add(entry.memberId, entry.amount);
  }
  for (const entry of owed) {
    add(entry.memberId, -entry.amount);
  }
  for (const settlement of settlements) {
    add(settlement.fromMemberId, settlement.amount);
    add(settlement.toMemberId, -settlement.amount);
  }
  return members.map((member) => ({
    memberId: member.id,
    name: member.name,
    balance: totals.get(member.id) ?? 0,
  }));
}

interface Position {
  memberId: string;
  name: string;
  remaining: number;
}

function byLargestThenName(a: Position, b: Position): number {
  return (
    b.remaining - a.remaining ||
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) ||
    (a.memberId < b.memberId ? -1 : a.memberId > b.memberId ? 1 : 0)
  );
}

export function suggestTransfers(balances: MemberBalance[]): Transfer[] {
  const toPosition = ({ memberId, name, balance }: MemberBalance): Position => ({
    memberId,
    name,
    remaining: Math.abs(balance),
  });
  let debtors = balances.filter((entry) => entry.balance < 0).map(toPosition);
  let creditors = balances.filter((entry) => entry.balance > 0).map(toPosition);
  const transfers: Transfer[] = [];
  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(byLargestThenName);
    creditors.sort(byLargestThenName);
    const [debtor, creditor] = [debtors[0], creditors[0]] as [Position, Position];
    const amount = Math.min(debtor.remaining, creditor.remaining);
    transfers.push({ fromMemberId: debtor.memberId, toMemberId: creditor.memberId, amount });
    debtor.remaining -= amount;
    creditor.remaining -= amount;
    debtors = debtors.filter((entry) => entry.remaining > 0);
    creditors = creditors.filter((entry) => entry.remaining > 0);
  }
  return transfers;
}

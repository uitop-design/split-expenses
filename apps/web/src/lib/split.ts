export function splitEqually(amount: number, memberIds: string[]): Map<string, number> {
  const count = memberIds.length;
  if (count === 0) {
    return new Map();
  }
  const base = Math.floor(amount / count);
  const remainder = amount - base * count;
  return new Map(memberIds.map((id, index) => [id, base + (index < remainder ? 1 : 0)]));
}

export const queryKeys = {
  groups: ['groups'] as const,
  group: (groupId: string) => ['groups', groupId] as const,
  expenses: (groupId: string) => ['groups', groupId, 'expenses'] as const,
  balances: (groupId: string) => ['groups', groupId, 'balances'] as const,
  settlements: (groupId: string) => ['groups', groupId, 'settlements'] as const,
};

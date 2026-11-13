import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './client';
import { queryKeys } from './query-keys';
import { balancesSchema, settlementSchema, type Transfer } from './schemas';

export function useBalances(groupId: string) {
  return useQuery({
    queryKey: queryKeys.balances(groupId),
    queryFn: () => request(`/groups/${groupId}/balances`, balancesSchema),
  });
}

export function useSettlements(groupId: string) {
  return useQuery({
    queryKey: queryKeys.settlements(groupId),
    queryFn: () => request(`/groups/${groupId}/settlements`, z.array(settlementSchema)),
  });
}

export function useCreateSettlement(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transfer: Transfer) =>
      request(`/groups/${groupId}/settlements`, settlementSchema, {
        method: 'POST',
        body: transfer,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
}

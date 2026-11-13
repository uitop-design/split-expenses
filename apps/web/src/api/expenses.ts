import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from './client';
import { queryKeys } from './query-keys';
import {
  type CreateExpenseInput,
  expensePageSchema,
  expenseSchema,
  noContentSchema,
} from './schemas';

const PAGE_SIZE = 20;

export function useExpenses(groupId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.expenses(groupId),
    queryFn: ({ pageParam }) =>
      request(
        `/groups/${groupId}/expenses?page=${pageParam}&limit=${PAGE_SIZE}`,
        expensePageSchema,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });
}

export function useCreateExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) =>
      request(`/groups/${groupId}/expenses`, expenseSchema, { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
}

export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) =>
      request(`/groups/${groupId}/expenses/${expenseId}`, noContentSchema, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
}

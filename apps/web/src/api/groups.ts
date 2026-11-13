import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from './client';
import { queryKeys } from './query-keys';
import {
  type CreateGroupInput,
  groupDetailsSchema,
  groupSummarySchema,
  memberSchema,
  noContentSchema,
} from './schemas';

export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups,
    queryFn: () => request('/groups', z.array(groupSummarySchema)),
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: queryKeys.group(groupId),
    queryFn: () => request(`/groups/${groupId}`, groupDetailsSchema),
    retry: false,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupInput) =>
      request('/groups', groupDetailsSchema, { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
}

export function useRenameGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      request(`/groups/${groupId}`, groupDetailsSchema, { method: 'PATCH', body: { name } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
}

export function useDeleteGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request(`/groups/${groupId}`, noContentSchema, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups, exact: true }),
  });
}

export function useAddMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      request(`/groups/${groupId}/members`, memberSchema, { method: 'POST', body: { name } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
}

export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      request(`/groups/${groupId}/members/${memberId}`, noContentSchema, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
}

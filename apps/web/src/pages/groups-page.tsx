import { UsersIcon } from 'lucide-react';
import { useGroups } from '@/api/groups';
import { CreateGroupDialog } from '@/components/groups/create-group-dialog';
import { GroupCard, GroupCardSkeleton } from '@/components/groups/group-card';
import { QueryError } from '@/components/query-error';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

const SKELETON_KEYS = ['first', 'second', 'third'];

export function GroupsPage() {
  const groups = useGroups();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Groups</h1>
          <p className="text-muted-foreground text-sm">
            Track shared expenses and see who owes whom.
          </p>
        </div>
        {groups.data && groups.data.length > 0 && <CreateGroupDialog />}
      </div>
      {groups.isPending && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SKELETON_KEYS.map((key) => (
            <GroupCardSkeleton key={key} />
          ))}
        </div>
      )}
      {groups.isError && <QueryError error={groups.error} onRetry={() => groups.refetch()} />}
      {groups.data?.length === 0 && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No groups yet</EmptyTitle>
            <EmptyDescription>
              Create a group, add expenses and Split Expenses will tell everyone how to settle up.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateGroupDialog />
          </EmptyContent>
        </Empty>
      )}
      {groups.data && groups.data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.data.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

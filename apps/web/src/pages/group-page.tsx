import { useParams } from 'react-router';
import { isNotFound } from '@/api/client';
import { useGroup } from '@/api/groups';
import { ExpensesTab } from '@/components/group/expenses-tab';
import { GroupHeader, GroupHeaderSkeleton } from '@/components/group/group-header';
import { QueryError } from '@/components/query-error';
import { NotFoundPage } from '@/pages/not-found-page';

export function GroupPage() {
  const { groupId = '' } = useParams();
  const group = useGroup(groupId);

  if (group.isPending) {
    return <GroupHeaderSkeleton />;
  }
  if (group.isError) {
    return isNotFound(group.error) ? (
      <NotFoundPage
        title="Group not found"
        description="It may have been deleted or the link is incorrect."
      />
    ) : (
      <QueryError error={group.error} onRetry={() => group.refetch()} />
    );
  }

  return (
    <div className="space-y-6">
      <GroupHeader group={group.data} />
      <ExpensesTab group={group.data} />
    </div>
  );
}

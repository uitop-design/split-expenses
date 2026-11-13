import { useParams } from 'react-router';
import { isNotFound } from '@/api/client';
import { useGroup } from '@/api/groups';
import { BalancesTab } from '@/components/group/balances-tab';
import { ExpensesTab } from '@/components/group/expenses-tab';
import { GroupHeader, GroupHeaderSkeleton } from '@/components/group/group-header';
import { QueryError } from '@/components/query-error';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      <Tabs defaultValue="expenses" className="gap-4">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses">
          <ExpensesTab group={group.data} />
        </TabsContent>
        <TabsContent value="balances">
          <BalancesTab group={group.data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

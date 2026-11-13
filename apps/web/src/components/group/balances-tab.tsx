import { ArrowRightIcon, CircleCheckIcon, HistoryIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useBalances, useCreateSettlement, useSettlements } from '@/api/balances';
import type { GroupDetails, Transfer } from '@/api/schemas';
import { MemberAvatar } from '@/components/member-avatar';
import { QueryError } from '@/components/query-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

const SKELETON_KEYS = ['first', 'second', 'third'];

function transferKey(transfer: Transfer): string {
  return `${transfer.fromMemberId}:${transfer.toMemberId}`;
}

function RowsSkeleton() {
  return (
    <div className="space-y-3">
      {SKELETON_KEYS.map((key) => (
        <div key={key} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function BalancesTab({ group }: { group: GroupDetails }) {
  const balances = useBalances(group.id);
  const settlements = useSettlements(group.id);
  const createSettlement = useCreateSettlement(group.id);
  const memberNames = new Map(group.members.map((member) => [member.id, member.name]));
  const nameOf = (memberId: string) => memberNames.get(memberId) ?? 'Unknown';
  const pendingKey =
    createSettlement.isPending && createSettlement.variables
      ? transferKey(createSettlement.variables)
      : null;

  const settleUp = (transfer: Transfer) =>
    createSettlement.mutate(transfer, {
      onSuccess: () =>
        toast.success(
          `${nameOf(transfer.fromMemberId)} paid ${nameOf(transfer.toMemberId)} ${formatMoney(transfer.amount, group.currency)}`,
        ),
    });

  if (balances.isError) {
    return <QueryError error={balances.error} onRetry={() => balances.refetch()} />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Balances</CardTitle>
          <CardDescription>Positive means the group owes this member.</CardDescription>
        </CardHeader>
        <CardContent>
          {balances.isPending ? (
            <RowsSkeleton />
          ) : (
            <ul className="space-y-3">
              {balances.data.balances.map((entry) => (
                <li key={entry.memberId} className="flex items-center gap-3">
                  <MemberAvatar name={entry.name} />
                  <span className="flex-1 truncate font-medium text-sm">{entry.name}</span>
                  <span
                    className={cn(
                      'font-semibold text-sm tabular-nums',
                      entry.balance > 0 && 'text-emerald-600 dark:text-emerald-400',
                      entry.balance < 0 && 'text-red-600 dark:text-red-400',
                      entry.balance === 0 && 'text-muted-foreground',
                    )}
                  >
                    {entry.balance === 0
                      ? 'Settled up'
                      : formatMoney(entry.balance, group.currency, { signed: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Suggested transfers</CardTitle>
          <CardDescription>The fewest payments that settle everyone up.</CardDescription>
        </CardHeader>
        <CardContent>
          {balances.isPending && <RowsSkeleton />}
          {balances.data?.transfers.length === 0 && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CircleCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
              Everyone is settled up.
            </div>
          )}
          {balances.data && balances.data.transfers.length > 0 && (
            <ul className="space-y-3">
              {balances.data.transfers.map((transfer) => (
                <li
                  key={transferKey(transfer)}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2"
                >
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="truncate font-medium">{nameOf(transfer.fromMemberId)}</span>
                    <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{nameOf(transfer.toMemberId)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm tabular-nums">
                      {formatMoney(transfer.amount, group.currency)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={createSettlement.isPending}
                      onClick={() => settleUp(transfer)}
                    >
                      {pendingKey === transferKey(transfer) && <Spinner />}
                      Settle up
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Settlement history</CardTitle>
          <CardDescription>Payments recorded between members.</CardDescription>
        </CardHeader>
        <CardContent>
          {settlements.isPending && <RowsSkeleton />}
          {settlements.isError && (
            <p className="text-destructive text-sm">Could not load settlements.</p>
          )}
          {settlements.data?.length === 0 && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <HistoryIcon className="size-4" />
              No settlements yet.
            </div>
          )}
          {settlements.data && settlements.data.length > 0 && (
            <ul className="divide-y">
              {settlements.data.map((settlement) => (
                <li
                  key={settlement.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="text-sm">
                    <span className="font-medium">{nameOf(settlement.fromMemberId)}</span>
                    <span className="text-muted-foreground"> paid </span>
                    <span className="font-medium">{nameOf(settlement.toMemberId)}</span>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(settlement.createdAt)}
                    </p>
                  </div>
                  <span className="font-semibold text-sm tabular-nums">
                    {formatMoney(settlement.amount, group.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

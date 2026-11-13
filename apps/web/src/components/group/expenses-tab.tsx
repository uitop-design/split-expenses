import { ReceiptTextIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDeleteExpense, useExpenses } from '@/api/expenses';
import type { Expense, GroupDetails } from '@/api/schemas';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { AddExpenseDialog } from '@/components/group/add-expense-dialog';
import { QueryError } from '@/components/query-error';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';

const SKELETON_KEYS = ['first', 'second', 'third', 'fourth'];

export function ExpensesTab({ group }: { group: GroupDetails }) {
  const expenses = useExpenses(group.id);
  const deleteExpense = useDeleteExpense(group.id);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const memberNames = new Map(group.members.map((member) => [member.id, member.name]));
  const items = expenses.data?.pages.flatMap((page) => page.items) ?? [];
  const total = expenses.data?.pages[0]?.total ?? 0;

  const confirmDelete = () => {
    if (!expenseToDelete) {
      return;
    }
    deleteExpense.mutate(expenseToDelete.id, {
      onSuccess: () => toast.success('Expense deleted'),
      onSettled: () => setExpenseToDelete(null),
    });
  };

  if (expenses.isError) {
    return <QueryError error={expenses.error} onRetry={() => expenses.refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          {expenses.isPending
            ? 'Loading expenses…'
            : `${total} ${total === 1 ? 'expense' : 'expenses'}`}
        </p>
        {group.members.length > 0 && <AddExpenseDialog group={group} />}
      </div>
      {expenses.isPending && (
        <Card className="gap-0 divide-y py-0">
          {SKELETON_KEYS.map((key) => (
            <div key={key} className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </Card>
      )}
      {!expenses.isPending && items.length === 0 && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptTextIcon />
            </EmptyMedia>
            <EmptyTitle>No expenses yet</EmptyTitle>
            <EmptyDescription>
              Add the first expense and balances will appear here.
            </EmptyDescription>
          </EmptyHeader>
          {group.members.length > 0 && (
            <EmptyContent>
              <AddExpenseDialog group={group} />
            </EmptyContent>
          )}
        </Empty>
      )}
      {items.length > 0 && (
        <Card className="gap-0 divide-y py-0">
          {items.map((expense) => (
            <div key={expense.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{expense.description}</p>
                <p className="text-muted-foreground text-sm">
                  Paid by {memberNames.get(expense.paidById) ?? 'Unknown'} ·{' '}
                  {formatDate(expense.spentAt)} · split between {expense.shares.length}
                </p>
              </div>
              <p className="whitespace-nowrap font-semibold tabular-nums">
                {formatMoney(expense.amount, group.currency)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${expense.description}`}
                onClick={() => setExpenseToDelete(expense)}
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </Card>
      )}
      {expenses.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => expenses.fetchNextPage()}
            disabled={expenses.isFetchingNextPage}
          >
            {expenses.isFetchingNextPage && <Spinner />}
            Load more
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={expenseToDelete !== null}
        onOpenChange={(next) => !next && setExpenseToDelete(null)}
        title="Delete expense?"
        description={
          expenseToDelete && (
            <>
              “{expenseToDelete.description}” for{' '}
              {formatMoney(expenseToDelete.amount, group.currency)} will be deleted and balances
              will be recalculated.
            </>
          )
        }
        confirmLabel="Delete"
        pending={deleteExpense.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

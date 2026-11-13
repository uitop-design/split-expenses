import { UsersIcon } from 'lucide-react';
import { Link } from 'react-router';
import type { GroupSummary } from '@/api/schemas';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/money';

export function GroupCard({ group }: { group: GroupSummary }) {
  return (
    <Link
      to={`/groups/${group.id}`}
      className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="truncate">{group.name}</CardTitle>
            <Badge variant="secondary">{group.currency}</Badge>
          </div>
          <CardDescription className="flex items-center gap-1.5">
            <UsersIcon className="size-3.5" />
            {group.membersCount} {group.membersCount === 1 ? 'member' : 'members'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">Total spent</p>
          <p className="font-semibold text-2xl tabular-nums tracking-tight">
            {formatMoney(group.totalSpent, group.currency)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function GroupCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-32" />
      </CardContent>
    </Card>
  );
}

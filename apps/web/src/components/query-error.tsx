import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-react';
import { errorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function QueryError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>Could not load data</EmptyTitle>
        <EmptyDescription>{errorMessage(error)}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCwIcon />
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}

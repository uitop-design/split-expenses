import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, EllipsisIcon, PencilIcon, Trash2Icon, UsersIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useDeleteGroup } from '@/api/groups';
import { queryKeys } from '@/api/query-keys';
import type { GroupDetails } from '@/api/schemas';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { MembersSheet } from '@/components/group/members-sheet';
import { RenameGroupDialog } from '@/components/group/rename-group-dialog';
import { MemberAvatar } from '@/components/member-avatar';
import { AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

const VISIBLE_AVATARS = 5;

type OpenDialog = 'rename' | 'members' | 'delete' | null;

export function GroupHeader({ group }: { group: GroupDetails }) {
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteGroup = useDeleteGroup(group.id);
  const hiddenMembers = group.members.length - VISIBLE_AVATARS;

  const onDialogChange = (name: OpenDialog) => (open: boolean) => setDialog(open ? name : null);

  const confirmDelete = () =>
    deleteGroup.mutate(undefined, {
      onSuccess: () => {
        toast.success(`Group “${group.name}” deleted`);
        navigate('/');
        queryClient.removeQueries({ queryKey: queryKeys.group(group.id) });
      },
    });

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2.5 text-muted-foreground">
        <Link to="/">
          <ArrowLeftIcon />
          All groups
        </Link>
      </Button>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate font-semibold text-2xl tracking-tight">{group.name}</h1>
            <Badge variant="secondary">{group.currency}</Badge>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md text-left text-muted-foreground text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => setDialog('members')}
          >
            <AvatarGroup>
              {group.members.slice(0, VISIBLE_AVATARS).map((member) => (
                <MemberAvatar key={member.id} name={member.name} />
              ))}
              {hiddenMembers > 0 && <AvatarGroupCount>+{hiddenMembers}</AvatarGroupCount>}
            </AvatarGroup>
            {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Group actions">
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setDialog('rename')}>
              <PencilIcon />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDialog('members')}>
              <UsersIcon />
              Manage members
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDialog('delete')}>
              <Trash2Icon />
              Delete group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <RenameGroupDialog
        group={group}
        open={dialog === 'rename'}
        onOpenChange={onDialogChange('rename')}
      />
      <MembersSheet
        group={group}
        open={dialog === 'members'}
        onOpenChange={onDialogChange('members')}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={onDialogChange('delete')}
        title={`Delete “${group.name}”?`}
        description="All members, expenses and settlements of this group will be deleted permanently."
        confirmLabel="Delete group"
        pending={deleteGroup.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export function GroupHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-28" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-8 w-40" />
      </div>
    </div>
  );
}

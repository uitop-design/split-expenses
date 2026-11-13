import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAddMember, useRemoveMember } from '@/api/groups';
import type { GroupDetails, Member } from '@/api/schemas';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { MemberAvatar } from '@/components/member-avatar';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';

const MAX_MEMBERS = 20;

const formSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(32, 'Name must be at most 32 characters'),
});

interface MembersSheetProps {
  group: GroupDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembersSheet({ group, open, onOpenChange }: MembersSheetProps) {
  const addMember = useAddMember(group.id);
  const removeMember = useRemoveMember(group.id);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const form = useForm({ resolver: zodResolver(formSchema), defaultValues: { name: '' } });
  const isFull = group.members.length >= MAX_MEMBERS;

  const onSubmit = form.handleSubmit(({ name }) =>
    addMember.mutate(name, {
      onSuccess: (member) => {
        toast.success(`${member.name} joined the group`);
        form.reset({ name: '' });
      },
    }),
  );

  const confirmRemove = () => {
    if (!memberToRemove) {
      return;
    }
    removeMember.mutate(memberToRemove.id, {
      onSuccess: () => toast.success(`${memberToRemove.name} was removed`),
      onSettled: () => setMemberToRemove(null),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Members</SheetTitle>
          <SheetDescription>
            Members with expenses, shares or settlements cannot be removed.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
          <form onSubmit={onSubmit}>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="new-member">Add member</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      {...field}
                      id="new-member"
                      placeholder="Name"
                      autoComplete="off"
                      maxLength={32}
                      disabled={isFull}
                      aria-invalid={fieldState.invalid}
                    />
                    <Button type="submit" disabled={addMember.isPending || isFull}>
                      {addMember.isPending ? <Spinner /> : <PlusIcon />}
                      Add
                    </Button>
                  </div>
                  {isFull && (
                    <FieldDescription>
                      A group can have at most {MAX_MEMBERS} members.
                    </FieldDescription>
                  )}
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </form>
          <ul className="divide-y rounded-lg border">
            {group.members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-3 py-2">
                <MemberAvatar name={member.name} />
                <span className="flex-1 truncate font-medium text-sm">{member.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${member.name}`}
                  onClick={() => setMemberToRemove(member)}
                >
                  <Trash2Icon />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
      <ConfirmDialog
        open={memberToRemove !== null}
        onOpenChange={(next) => !next && setMemberToRemove(null)}
        title={`Remove ${memberToRemove?.name ?? 'member'}?`}
        description="The member will be removed from the group. This cannot be undone."
        confirmLabel="Remove"
        pending={removeMember.isPending}
        onConfirm={confirmRemove}
      />
    </Sheet>
  );
}

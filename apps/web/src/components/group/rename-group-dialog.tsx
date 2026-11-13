import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useRenameGroup } from '@/api/groups';
import type { GroupDetails } from '@/api/schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(64, 'Name must be at most 64 characters'),
});

interface RenameGroupDialogProps {
  group: GroupDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameGroupDialog({ group, open, onOpenChange }: RenameGroupDialogProps) {
  const renameGroup = useRenameGroup(group.id);
  const form = useForm({ resolver: zodResolver(formSchema), defaultValues: { name: group.name } });

  useEffect(() => {
    if (open) {
      form.reset({ name: group.name });
    }
  }, [open, group.name, form]);

  const onSubmit = form.handleSubmit(({ name }) =>
    renameGroup.mutate(name, {
      onSuccess: () => {
        toast.success('Group renamed');
        onOpenChange(false);
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} className="grid gap-6">
          <DialogHeader>
            <DialogTitle>Rename group</DialogTitle>
          </DialogHeader>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="rename-group">Name</FieldLabel>
                <Input
                  {...field}
                  id="rename-group"
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={renameGroup.isPending}>
              {renameGroup.isPending && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

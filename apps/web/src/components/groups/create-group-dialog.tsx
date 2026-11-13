import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';
import { useCreateGroup } from '@/api/groups';
import { MemberNamesInput } from '@/components/groups/member-names-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currencies';

const MAX_MEMBERS = 20;

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(64, 'Name must be at most 64 characters'),
  currency: z.string().length(3),
  members: z
    .array(z.string())
    .min(2, 'Add at least 2 members')
    .max(MAX_MEMBERS, `A group can have at most ${MAX_MEMBERS} members`),
});

type FormValues = z.input<typeof formSchema>;

const defaultValues: FormValues = { name: '', currency: DEFAULT_CURRENCY, members: [] };

export function CreateGroupDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const createGroup = useCreateGroup();
  const form = useForm({ resolver: zodResolver(formSchema), defaultValues });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      form.reset(defaultValues);
    }
  };

  const onSubmit = form.handleSubmit((values) =>
    createGroup.mutate(values, {
      onSuccess: (group) => {
        toast.success(`Group “${group.name}” created`);
        setOpen(false);
        navigate(`/groups/${group.id}`);
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PlusIcon />
            New group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} className="grid gap-6">
          <DialogHeader>
            <DialogTitle>New group</DialogTitle>
            <DialogDescription>
              Create a group for a trip, a shared flat or any other occasion.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="group-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="group-name"
                    placeholder="Trip to Lviv"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="currency"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="group-currency">Currency</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="group-currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} — {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              name="members"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="group-members">Members</FieldLabel>
                  <MemberNamesInput
                    id="group-members"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                    max={MAX_MEMBERS}
                  />
                  <FieldDescription>
                    From 2 to {MAX_MEMBERS} people, names are unique.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createGroup.isPending}>
              {createGroup.isPending && <Spinner />}
              Create group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

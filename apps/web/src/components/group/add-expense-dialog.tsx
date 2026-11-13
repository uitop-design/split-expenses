import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useCreateExpense } from '@/api/expenses';
import type { CreateExpenseInput, GroupDetails } from '@/api/schemas';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { todayIsoDate } from '@/lib/dates';
import { formatMoney, parseMoney } from '@/lib/money';
import { splitEqually } from '@/lib/split';
import { cn } from '@/lib/utils';

const MAX_AMOUNT = 100_000_000;

type SplitMode = 'equal' | 'exact';

function buildSchema(currency: string) {
  return z
    .object({
      description: z
        .string()
        .trim()
        .min(1, 'Enter a description')
        .max(120, 'Description must be at most 120 characters'),
      amount: z.string().superRefine((value, ctx) => {
        const amount = parseMoney(value, currency);
        if (amount === null || amount === 0) {
          ctx.addIssue({ code: 'custom', message: 'Enter an amount greater than zero' });
        } else if (amount > MAX_AMOUNT) {
          ctx.addIssue({
            code: 'custom',
            message: `Amount must be at most ${formatMoney(MAX_AMOUNT, currency)}`,
          });
        }
      }),
      paidById: z.string().min(1, 'Choose who paid'),
      spentAt: z
        .string()
        .min(1, 'Choose a date')
        .refine((value) => value <= todayIsoDate(), 'Date cannot be in the future'),
      mode: z.enum(['equal', 'exact']),
      memberIds: z.array(z.string()),
      exactAmounts: z.record(z.string(), z.string()),
    })
    .superRefine((values, ctx) => {
      const amount = parseMoney(values.amount, currency);
      if (values.mode === 'equal') {
        if (values.memberIds.length === 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['memberIds'],
            message: 'Select at least one member',
          });
        } else if (amount !== null && amount > 0 && amount < values.memberIds.length) {
          ctx.addIssue({
            code: 'custom',
            path: ['memberIds'],
            message: `The amount is too small to split between ${values.memberIds.length} members`,
          });
        }
        return;
      }
      let sum = 0;
      for (const [memberId, input] of Object.entries(values.exactAmounts)) {
        if (input.trim() === '') {
          continue;
        }
        const share = parseMoney(input, currency);
        if (share === null) {
          ctx.addIssue({
            code: 'custom',
            path: ['exactAmounts', memberId],
            message: 'Invalid amount',
          });
          return;
        }
        sum += share;
      }
      if (amount !== null && amount > 0 && sum !== amount) {
        ctx.addIssue({
          code: 'custom',
          path: ['exactAmounts'],
          message: `Shares must add up to ${formatMoney(amount, currency)}`,
        });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function toInput(values: FormValues, group: GroupDetails): CreateExpenseInput {
  const amount = parseMoney(values.amount, group.currency) ?? 0;
  const base = {
    description: values.description,
    amount,
    paidById: values.paidById,
    spentAt: values.spentAt,
  };
  if (values.mode === 'equal') {
    const selected = new Set(values.memberIds);
    return {
      ...base,
      split: {
        type: 'equal',
        memberIds: group.members.filter((member) => selected.has(member.id)).map(({ id }) => id),
      },
    };
  }
  const shares = group.members
    .map((member) => ({
      memberId: member.id,
      amount: parseMoney(values.exactAmounts[member.id] ?? '', group.currency) ?? 0,
    }))
    .filter((share) => share.amount > 0);
  return { ...base, split: { type: 'exact', shares } };
}

function defaultValues(group: GroupDetails): FormValues {
  return {
    description: '',
    amount: '',
    paidById: group.members[0]?.id ?? '',
    spentAt: todayIsoDate(),
    mode: 'equal',
    memberIds: group.members.map((member) => member.id),
    exactAmounts: {},
  };
}

export function AddExpenseDialog({ group }: { group: GroupDetails }) {
  const [open, setOpen] = useState(false);
  const createExpense = useCreateExpense(group.id);
  const schema = useMemo(() => buildSchema(group.currency), [group.currency]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(group),
  });
  const [amountInput, mode, memberIds, exactAmounts] = useWatch({
    control: form.control,
    name: ['amount', 'mode', 'memberIds', 'exactAmounts'],
  });
  const amount = parseMoney(amountInput, group.currency);

  const equalShares = useMemo(() => {
    const selected = new Set(memberIds);
    const orderedIds = group.members.filter((m) => selected.has(m.id)).map(({ id }) => id);
    return splitEqually(amount ?? 0, orderedIds);
  }, [amount, memberIds, group.members]);

  const exactSum = Object.values(exactAmounts).reduce(
    (sum, value) => sum + (parseMoney(value, group.currency) ?? 0),
    0,
  );
  const remaining = (amount ?? 0) - exactSum;

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      form.reset(defaultValues(group));
    }
  };

  const onSubmit = form.handleSubmit((values) =>
    createExpense.mutate(toInput(values, group), {
      onSuccess: (expense) => {
        toast.success(`“${expense.description}” added`);
        setOpen(false);
      },
    }),
  );

  const toggleMember = (memberId: string, checked: boolean) => {
    const next = checked
      ? [...memberIds, memberId]
      : memberIds.filter((selectedId) => selectedId !== memberId);
    form.setValue('memberIds', next, { shouldValidate: form.formState.isSubmitted });
  };

  const exactError = form.formState.errors.exactAmounts?.message;
  const sharesError =
    mode === 'equal'
      ? form.formState.errors.memberIds?.message
      : typeof exactError === 'string'
        ? exactError
        : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          Add expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <form onSubmit={onSubmit} className="grid gap-6">
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
            <DialogDescription>Record who paid and how to split it.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="expense-description">Description</FieldLabel>
                  <Input
                    {...field}
                    id="expense-description"
                    placeholder="Dinner at the market"
                    autoComplete="off"
                    maxLength={120}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="amount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="expense-amount">Amount, {group.currency}</FieldLabel>
                    <Input
                      {...field}
                      id="expense-amount"
                      inputMode="decimal"
                      placeholder="0.00"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="spentAt"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="expense-date">Date</FieldLabel>
                    <Input
                      {...field}
                      id="expense-date"
                      type="date"
                      max={todayIsoDate()}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <Controller
              name="paidById"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="expense-payer">Paid by</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="expense-payer"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Choose a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {group.members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Field data-invalid={Boolean(sharesError)}>
              <div className="flex items-center justify-between gap-4">
                <FieldLabel>Split</FieldLabel>
                <Controller
                  name="mode"
                  control={form.control}
                  render={({ field }) => (
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      size="sm"
                      value={field.value}
                      onValueChange={(value) => value && field.onChange(value as SplitMode)}
                    >
                      <ToggleGroupItem value="equal">Equal</ToggleGroupItem>
                      <ToggleGroupItem value="exact">Exact</ToggleGroupItem>
                    </ToggleGroup>
                  )}
                />
              </div>
              <ul className="divide-y rounded-lg border">
                {group.members.map((member) => (
                  <li key={member.id} className="flex min-h-12 items-center gap-3 px-3 py-2">
                    {mode === 'equal' ? (
                      <>
                        <Checkbox
                          id={`share-${member.id}`}
                          checked={memberIds.includes(member.id)}
                          onCheckedChange={(checked) => toggleMember(member.id, checked === true)}
                        />
                        <label
                          htmlFor={`share-${member.id}`}
                          className="flex-1 truncate font-medium text-sm"
                        >
                          {member.name}
                        </label>
                        <span className="text-muted-foreground text-sm tabular-nums">
                          {equalShares.has(member.id)
                            ? formatMoney(equalShares.get(member.id) ?? 0, group.currency)
                            : '—'}
                        </span>
                      </>
                    ) : (
                      <>
                        <label
                          htmlFor={`exact-${member.id}`}
                          className="flex-1 truncate font-medium text-sm"
                        >
                          {member.name}
                        </label>
                        <Controller
                          name={`exactAmounts.${member.id}`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Input
                              id={`exact-${member.id}`}
                              value={field.value ?? ''}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              inputMode="decimal"
                              placeholder="0.00"
                              autoComplete="off"
                              className="w-28 text-right tabular-nums"
                              aria-invalid={fieldState.invalid}
                            />
                          )}
                        />
                      </>
                    )}
                  </li>
                ))}
              </ul>
              {mode === 'exact' && (
                <p
                  className={cn(
                    'text-sm tabular-nums',
                    remaining === 0 && 'text-emerald-600 dark:text-emerald-400',
                    remaining > 0 && 'text-muted-foreground',
                    remaining < 0 && 'text-destructive',
                  )}
                >
                  {remaining === 0
                    ? 'Everything is split'
                    : remaining > 0
                      ? `Left to split: ${formatMoney(remaining, group.currency)}`
                      : `Over by ${formatMoney(-remaining, group.currency)}`}
                </p>
              )}
              {sharesError && <FieldError>{sharesError}</FieldError>}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createExpense.isPending}>
              {createExpense.isPending && <Spinner />}
              Add expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

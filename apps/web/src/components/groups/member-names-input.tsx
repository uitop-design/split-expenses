import { PlusIcon, XIcon } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MemberNamesInputProps {
  id?: string;
  value: string[];
  onChange: (names: string[]) => void;
  invalid?: boolean;
  max: number;
}

export function MemberNamesInput({ id, value, onChange, invalid, max }: MemberNamesInputProps) {
  const [draft, setDraft] = useState('');
  const name = draft.trim();
  const isDuplicate = value.some((item) => item.toLowerCase() === name.toLowerCase());
  const canAdd = name.length > 0 && name.length <= 32 && !isDuplicate && value.length < max;

  const add = () => {
    if (canAdd) {
      onChange([...value, name]);
      setDraft('');
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add();
    }
    if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          maxLength={32}
          placeholder="Type a name and press Enter"
          aria-invalid={invalid}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!canAdd}>
          <PlusIcon />
          Add
        </Button>
      </div>
      {isDuplicate && name.length > 0 && (
        <p className="text-muted-foreground text-xs">“{name}” is already in the list.</p>
      )}
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((item) => (
            <li key={item}>
              <Badge variant="secondary" className="h-7 gap-1 pr-1 pl-2.5 text-sm">
                {item}
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-foreground/10"
                  aria-label={`Remove ${item}`}
                  onClick={() => onChange(value.filter((other) => other !== item))}
                >
                  <XIcon className="size-3.5" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

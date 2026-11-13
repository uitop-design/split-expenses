import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { initials } from '@/lib/initials';
import { cn } from '@/lib/utils';

export function MemberAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn('size-8', className)} title={name}>
      <AvatarFallback className="text-xs font-medium">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

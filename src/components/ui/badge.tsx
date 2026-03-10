import { cn } from '@/lib/cn';

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: string;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
        tone === 'neutral' && 'border-white/10 bg-white/5 text-muted',
        tone === 'success' && 'border-accent2/20 bg-accent2/10 text-accent2',
        tone === 'warning' && 'border-accent/20 bg-accent/10 text-accent',
      )}
    >
      {children}
    </span>
  );
}

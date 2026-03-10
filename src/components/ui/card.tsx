import type { PropsWithChildren, ReactNode } from 'react';

export function Card({
  title,
  eyebrow,
  action,
  children,
}: PropsWithChildren<{ title?: string; eyebrow?: string; action?: ReactNode }>) {
  return (
    <section className="panel px-5 py-5">
      {(title || eyebrow || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {eyebrow ? <p className="mb-1 text-xs uppercase tracking-[0.3em] text-muted">{eyebrow}</p> : null}
            {title ? <h2 className="font-display text-2xl font-semibold text-text">{title}</h2> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

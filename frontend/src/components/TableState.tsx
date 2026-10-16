import type { ReactNode } from 'react';

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skeleton" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton__row">
          <span style={{ width: `${28 + ((i * 17) % 30)}%` }} />
          <span style={{ width: '14%' }} />
          <span style={{ width: '10%' }} />
        </div>
      ))}
    </div>
  );
}

interface EmptyProps {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

export function Empty({ title, children, action }: EmptyProps) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {children && <p className="empty__text">{children}</p>}
      {action}
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** 1 … 4 5 6 … 20 — never more than seven buttons, however many pages exist. */
function windowed(page: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | 'gap')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push('gap');
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push('gap');
  out.push(total);
  return out;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pager" aria-label="Pagination">
      <button type="button" className="btn btn--sm" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>
        Previous
      </button>
      <ol className="pager__pages">
        {windowed(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} className="pager__gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={`pager__page ${p === page ? 'is-current' : ''}`}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ol>
      <button type="button" className="btn btn--sm" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
        Next
      </button>
    </nav>
  );
}

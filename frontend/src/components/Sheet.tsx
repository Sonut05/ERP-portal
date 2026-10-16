import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface SheetProps {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** sm = small centred dialog, md/lg = panel sliding in from the right */
  size?: 'sm' | 'md' | 'lg';
  /** Forms should pass false so a stray click never throws away typed data. */
  dismissOnBackdrop?: boolean;
  /** When set, the body and footer are wrapped in a <form>. */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  /** Marks the sheet as the thing window.print() should output. */
  printable?: boolean;
}

// Only the top-most sheet reacts to Escape / Tab, so a confirm dialog on top of a detail panel closes alone.
const stack: symbol[] = [];

// Page scroll stays locked while at least one sheet is open, whatever order they close in.
let scrollLocks = 0;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function Sheet({
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = 'md',
  dismissOnBackdrop = true,
  onSubmit,
  printable = false,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const id = Symbol('sheet');
    stack.push(id);
    const panel = panelRef.current;
    const opener = document.activeElement as HTMLElement | null;
    if (scrollLocks++ === 0) document.body.style.overflow = 'hidden';

    // Forms open on their first field; read-only panels take focus themselves.
    const firstField = panel?.querySelector<HTMLElement>('input:not([type=hidden]):not([disabled]), select, textarea');
    (firstField ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(id), 1);
      if (--scrollLocks === 0) document.body.style.overflow = '';
      opener?.focus?.();
    };
  }, []);

  const inner = (
    <>
      <div className="sheet__body">{children}</div>
      {footer && <footer className="sheet__foot">{footer}</footer>}
    </>
  );

  return createPortal(
    <div
      className={`scrim ${size === 'sm' ? 'scrim--center' : ''}`}
      onMouseDown={(e) => {
        if (dismissOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`sheet sheet--${size} ${printable ? 'sheet--printable' : ''}`}
      >
        <header className="sheet__head">
          <div>
            <h2 id={titleId} className="sheet__title">
              {title}
            </h2>
            {subtitle && <div className="sheet__sub">{subtitle}</div>}
          </div>
          <button type="button" className="btn btn--sm no-print" onClick={onClose}>
            Close
          </button>
        </header>
        {onSubmit ? (
          <form className="sheet__form" onSubmit={onSubmit}>
            {inner}
          </form>
        ) : (
          inner
        )}
      </div>
    </div>,
    document.body,
  );
}

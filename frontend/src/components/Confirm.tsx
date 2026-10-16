import type { ReactNode } from 'react';
import Sheet from './Sheet';

interface ConfirmProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

/** Small centred dialog for actions that can't be undone from the UI. */
export default function Confirm({ title, children, confirmLabel, cancelLabel = 'Go back', onConfirm, onCancel, busy }: ConfirmProps) {
  return (
    <Sheet
      size="sm"
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn--danger-solid" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-text">{children}</p>
    </Sheet>
  );
}

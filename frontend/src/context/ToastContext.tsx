import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastType } from './toastContext';

interface ToastState {
  id: number;
  type: ToastType;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((type: ToastType, message: string) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), type, message });
    // Errors stay longer: they usually say something the person needs to act on.
    timer.current = window.setTimeout(() => setToast(null), type === 'error' ? 6000 : 3200);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region">
        {toast && (
          <div key={toast.id} className={`toast toast--${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
            <span>{toast.message}</span>
            <button type="button" className="toast__close" onClick={dismiss}>
              Dismiss
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

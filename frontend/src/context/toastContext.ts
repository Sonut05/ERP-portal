import { createContext } from 'react';

export type ToastType = 'success' | 'error';

export interface ToastApi {
  show: (type: ToastType, message: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

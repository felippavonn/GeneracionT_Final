/**
 * Toast System - Reserva Club Frontend
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { clsx } from 'clsx';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastColors = {
  success: 'toast-success',
  error: 'toast-error',
  warning: 'toast-warning',
  info: 'toast-info',
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const Icon = toastIcons[toast.type];

  return (
    <div className={clsx('toast', toastColors[toast.type])} role="alert">
      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-medium text-secondary-900">{toast.title}</p>
        {toast.message && <p className="text-sm text-secondary-600">{toast.message}</p>}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="btn btn-ghost p-1 text-secondary-400 hover:text-secondary-600"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration ?? 5000);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={hideToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
}

// Helpers convenientes
export function useToastHelpers() {
  const { showToast } = useToast();
  return {
    success: (title: string, message?: string) => showToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => showToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) => showToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => showToast({ type: 'info', title, message }),
  };
}
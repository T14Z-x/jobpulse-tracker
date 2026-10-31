'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
              : toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
              : 'bg-slate-900/90 dark:bg-slate-800/90 border-slate-700 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 hover:opacity-70 transition-opacity ml-2"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

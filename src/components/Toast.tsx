'use client';

import React from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-lg shadow-lg border border-[var(--line)] bg-[var(--ink)] text-[var(--bg)] text-[12px] font-medium animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          ) : (
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="p-0.5 opacity-60 hover:opacity-100 transition-opacity ml-1 cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

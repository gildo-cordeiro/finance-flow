import React, { createContext, useState, useContext, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../lib/cn';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const toast = {
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration)
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Portal/Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none select-none">
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto relative w-full bg-zinc-900/95 border border-zinc-800/80 text-zinc-100 shadow-2xl backdrop-blur-md rounded-2xl p-4 flex items-start gap-3.5 overflow-hidden animate-in slide-in-from-right-5 duration-300",
                isSuccess && "border-emerald-500/20",
                isError && "border-red-500/20"
              )}
            >
              {/* Left Color Indicator Bar */}
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-1",
                  isSuccess && "bg-emerald-500",
                  isError && "bg-red-500",
                  t.type === 'info' && "bg-blue-500"
                )}
              />

              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertTriangle className="w-5 h-5 text-red-400" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
              </div>

              {/* Message */}
              <div className="flex-1 text-sm font-medium leading-relaxed pr-6 text-zinc-200">
                {t.message}
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-0.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-all absolute top-3 right-3"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Shrinking Bottom Progress Line */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-[2px] animate-toast-progress",
                  isSuccess && "bg-emerald-500/40",
                  isError && "bg-red-500/40",
                  t.type === 'info' && "bg-blue-500/40"
                )}
                style={{
                  animationDuration: `${t.duration || 4000}ms`
                }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}

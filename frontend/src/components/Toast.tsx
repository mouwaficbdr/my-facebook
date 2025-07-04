import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number; // ms
}

interface ToastProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
  position?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';
}

const positionClasses = {
  'bottom-right': 'bottom-4 right-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-left': 'top-4 left-4',
};

export default function ToastContainer({
  toasts,
  onRemove,
  position = 'bottom-right',
}: ToastProps) {
  useEffect(() => {
    const timers = toasts.map((toast) =>
      setTimeout(() => onRemove(toast.id), toast.duration ?? 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onRemove]);

  return (
    <div
      className={`fixed z-50 flex flex-col gap-2 ${positionClasses[position]}`}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center px-4 py-3 rounded shadow-lg text-white animate-fade-in-down
            ${
              toast.type === 'success'
                ? 'bg-green-600'
                : toast.type === 'error'
                ? 'bg-red-600'
                : 'bg-blue-600'
            }
            min-w-[220px] max-w-xs w-fit`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            className="ml-4 text-white/80 hover:text-white focus:outline-none"
            onClick={() => onRemove(toast.id)}
            aria-label="Fermer la notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/*
// Exemple d'utilisation :
import React, { useState } from 'react';
import ToastContainer, { Toast } from './Toast';

function App() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = (msg: string, type: Toast['type'] = 'info') => {
    setToasts(ts => [...ts, { id: Date.now() + Math.random() + '', message: msg, type }]);
  };
  return (
    <>
      <button onClick={() => notify('Succès !', 'success')}>Test succès</button>
      <ToastContainer toasts={toasts} onRemove={id => setToasts(ts => ts.filter(t => t.id !== id))} />
    </>
  );
}
*/

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

const icons = {
  success: (
    <svg
      className="w-5 h-5 text-green-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" fill="#e6faed" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12l2 2 4-4"
        stroke="#22c55e"
        strokeWidth="2"
      />
    </svg>
  ),
  error: (
    <svg
      className="w-5 h-5 text-red-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" fill="#fde8e8" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 9l-6 6m0-6l6 6"
        stroke="#ef4444"
        strokeWidth="2"
      />
    </svg>
  ),
  info: (
    <svg
      className="w-5 h-5 text-blue-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" fill="#e0e7ff" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4m0 4h.01"
        stroke="#3b82f6"
        strokeWidth="2"
      />
    </svg>
  ),
};

export default function ToastContainer({
  toasts,
  onRemove,
  position = 'bottom-right',
}: ToastProps) {
  useEffect(() => {
    const timers = toasts.map((toast) =>
      setTimeout(() => onRemove(toast.id), toast.duration ?? 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onRemove]);

  return (
    <div
      className={`fixed z-50 flex flex-col gap-3 ${positionClasses[position]}`}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center px-6 py-4 rounded-2xl shadow-xl bg-white/95 border border-gray-100 backdrop-blur-lg animate-fade-in-down min-w-[260px] max-w-md w-fit transition-all
            ${
              toast.type === 'success'
                ? 'border-green-100'
                : toast.type === 'error'
                ? 'border-red-100'
                : 'border-blue-100'
            }`}
          style={{ boxShadow: '0 6px 32px 0 rgba(0,0,0,0.10)' }}
        >
          <span className="mr-4 flex-shrink-0">
            {icons[toast.type || 'info']}
          </span>
          <span className="flex-1 text-gray-800 text-base font-medium pr-2">
            {toast.message}
          </span>
          <button
            className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none text-xl font-bold rounded-full p-1 transition-colors duration-150"
            onClick={() => onRemove(toast.id)}
            aria-label="Fermer la notification"
            tabIndex={0}
            style={{ lineHeight: 1 }}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l8 8m0-8l-8 8"
              />
            </svg>
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

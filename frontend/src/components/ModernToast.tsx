import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';

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
  'bottom-right': 'bottom-6 right-6',
  'top-right': 'top-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-left': 'top-6 left-6',
};

const toastConfig = {
  success: {
    icon: CheckCircle2,
    bgClass: 'from-emerald-500/10 via-emerald-400/5 to-green-500/10',
    borderClass: 'border-emerald-500/20',
    iconClass: 'text-emerald-500',
    shadowClass: 'shadow-emerald-500/10',
  },
  error: {
    icon: AlertCircle,
    bgClass: 'from-red-500/10 via-rose-400/5 to-pink-500/10',
    borderClass: 'border-red-500/20',
    iconClass: 'text-red-500',
    shadowClass: 'shadow-red-500/10',
  },
  info: {
    icon: Info,
    bgClass: 'from-blue-500/10 via-cyan-400/5 to-indigo-500/10',
    borderClass: 'border-blue-500/20',
    iconClass: 'text-blue-500',
    shadowClass: 'shadow-blue-500/10',
  },
};

export default function ModernToast({
  toasts,
  onRemove,
  position = 'bottom-right',
}: ToastProps) {
  const [exitingToasts, setExitingToasts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        setExitingToasts((prev) => new Set(prev).add(toast.id));
        setTimeout(() => onRemove(toast.id), 200); // Wait for exit animation
      }, toast.duration ?? 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onRemove]);

  const getEnterAnimation = () => {
    switch (position) {
      case 'bottom-right':
      case 'top-right':
        return 'toast-enter-right';
      case 'bottom-left':
      case 'top-left':
        return 'toast-enter-left';
      default:
        return 'toast-enter-right';
    }
  };

  const getExitAnimation = () => {
    switch (position) {
      case 'bottom-right':
      case 'top-right':
        return 'toast-exit-right';
      case 'bottom-left':
      case 'top-left':
        return 'toast-exit-left';
      default:
        return 'toast-exit-right';
    }
  };

  const handleRemove = (id: string) => {
    setExitingToasts((prev) => new Set(prev).add(id));
    setTimeout(() => onRemove(id), 200); // Wait for exit animation
  };

  return (
    <div
      className={cn(
        'fixed z-50 pointer-events-none',
        positionClasses[position]
      )}
    >
      <div className="flex flex-col gap-3 max-w-sm">
        {toasts.map((toast) => {
          const config = toastConfig[toast.type || 'info'];
          const IconComponent = config.icon;
          const isExiting = exitingToasts.has(toast.id);

          return (
            <div
              key={toast.id}
              className={cn(
                'group relative pointer-events-auto',
                'backdrop-blur-md bg-gradient-to-r',
                config.bgClass,
                'border rounded-2xl p-4',
                config.borderClass,
                'shadow-2xl',
                config.shadowClass,
                'toast-hover',
                'before:absolute before:inset-0 before:rounded-2xl',
                'before:bg-white/5 before:backdrop-blur-sm',
                isExiting ? getExitAnimation() : getEnterAnimation()
              )}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 rounded-2xl opacity-50">
                <div
                  className={cn(
                    'absolute inset-0 rounded-2xl bg-gradient-to-r animate-pulse',
                    config.bgClass
                  )}
                />
              </div>

              {/* Enhanced close button - positioned outside flex content */}
              <button
                onClick={() => handleRemove(toast.id)}
                className={cn(
                  'absolute top-2 right-2 z-10',
                  'flex items-center justify-center',
                  'w-7 h-7 rounded-full',
                  'bg-white/20 backdrop-blur-sm',
                  'border border-white/30',
                  'text-slate-600',
                  'close-button-hover',
                  'close-button-enter',
                  'focus:outline-none focus:ring-2 focus:ring-white/40',
                  'group-hover:opacity-100 opacity-70'
                )}
                aria-label="Fermer la notification"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="relative flex items-start gap-3 pr-8">
                {/* Animated icon with glow effect */}
                <div
                  className={cn(
                    'flex-shrink-0 p-1 rounded-full',
                    'bg-white/10 backdrop-blur-sm',
                    'ring-1 ring-white/20',
                    'icon-enter'
                  )}
                >
                  <IconComponent
                    className={cn(
                      'w-5 h-5',
                      config.iconClass,
                      'drop-shadow-sm'
                    )}
                  />
                </div>

                {/* Message with enhanced typography */}
                <div className="flex-1 pt-0.5 message-enter">
                  <p
                    className={cn(
                      'text-sm font-medium leading-relaxed',
                      'text-slate-800',
                      'drop-shadow-sm'
                    )}
                  >
                    {toast.message}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className={cn(
                  'absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl origin-left',
                  'bg-gradient-to-r',
                  config.bgClass,
                  'opacity-60',
                  'progress-bar'
                )}
                style={{
                  animationDuration: `${(toast.duration ?? 4000) / 1000}s`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

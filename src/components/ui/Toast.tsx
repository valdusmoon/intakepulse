import { useEffect } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'loading';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function ToastComponent({ toast, onClose }: ToastProps) {
  const { id, type, title, description, duration = 5000, action } = toast;

  useEffect(() => {
    if (type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, type, duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = "relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4 transition-all duration-300 ease-in-out transform";
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-green-200 dark:border-green-800`;
      case 'error':
        return `${baseStyles} border-red-200 dark:border-red-800`;
      case 'info':
        return `${baseStyles} border-blue-200 dark:border-blue-800`;
      case 'loading':
        return `${baseStyles} border-gray-200 dark:border-gray-700`;
      default:
        return `${baseStyles} border-gray-200 dark:border-gray-700`;
    }
  };

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: '✅', color: 'text-green-600 dark:text-green-400' };
      case 'error':
        return { icon: '❌', color: 'text-red-600 dark:text-red-400' };
      case 'info':
        return { icon: '💙', color: 'text-blue-600 dark:text-blue-400' };
      case 'loading':
        return { 
          icon: (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
          ), 
          color: 'text-blue-600 dark:text-blue-400' 
        };
      default:
        return { icon: 'ℹ️', color: 'text-gray-600 dark:text-gray-400' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <div className={getToastStyles()}>
      {/* Close button */}
      {type !== 'loading' && (
        <button
          onClick={() => onClose(id)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close notification"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      )}

      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${color} text-lg`}>
          {typeof icon === 'string' ? icon : icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm ${color}`}>
            {title}
          </div>
          {description && (
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </div>
          )}
          
          {/* Action button */}
          {action && (
            <div className="mt-3">
              <button
                onClick={action.onClick}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-full"
        >
          <ToastComponent toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
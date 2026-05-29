import { useToast as useToastContext } from '@/contexts/ToastContext';

export function useToast() {
  const context = useToastContext();

  // Helper methods for common toast types
  const toast = {
    success: (title: string, description?: string, options?: { 
      duration?: number; 
      action?: { label: string; onClick: () => void } 
    }) => {
      return context.addToast({
        type: 'success',
        title,
        description,
        duration: options?.duration,
        action: options?.action,
      });
    },

    error: (title: string, description?: string, options?: { 
      duration?: number; 
      action?: { label: string; onClick: () => void } 
    }) => {
      return context.addToast({
        type: 'error',
        title,
        description,
        duration: options?.duration || 7000, // Longer duration for errors
        action: options?.action,
      });
    },

    info: (title: string, description?: string, options?: { 
      duration?: number; 
      action?: { label: string; onClick: () => void } 
    }) => {
      return context.addToast({
        type: 'info',
        title,
        description,
        duration: options?.duration,
        action: options?.action,
      });
    },

    warning: (title: string, description?: string, options?: { 
      duration?: number; 
      action?: { label: string; onClick: () => void } 
    }) => {
      return context.addToast({
        type: 'error', // Use error styling for warnings
        title,
        description,
        duration: options?.duration || 6000, // Medium duration for warnings
        action: options?.action,
      });
    },

    loading: (title: string, description?: string) => {
      return context.addToast({
        type: 'loading',
        title,
        description,
        duration: 0, // Loading toasts don't auto-dismiss
      });
    },

    // Method to update a toast (useful for loading -> success/error flow)
    update: (id: string, updates: { 
      type?: 'success' | 'error' | 'info' | 'loading';
      title?: string;
      description?: string;
      duration?: number;
      action?: { label: string; onClick: () => void };
    }) => {
      context.updateToast(id, updates);
    },

    // Method to dismiss a specific toast
    dismiss: (id: string) => {
      context.removeToast(id);
    },

    // Method to dismiss all toasts
    dismissAll: () => {
      context.clearToasts();
    },
  };

  return {
    toast,
    ...context,
  };
}
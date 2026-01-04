/**
 * useToast Hook
 * Self-contained toast utility hook
 * Provides toast notification functionality for components
 * This is a simplified implementation for the AtomGuard project
 */

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

const toasts: Toast[] = [];
const listeners: Array<() => void> = [];

// Subscribe to toast changes
const subscribe = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

// Notify all listeners
const notify = () => {
  listeners.forEach((listener) => listener());
};

/**
 * Hook for creating toast notifications
 * Returns functions to create toasts
 */
export function useToast() {
  const toast = (props: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      title: props.title,
      description: props.description,
      variant: props.variant || "default",
    };
    
    toasts.push(newToast);
    notify();
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      const index = toasts.findIndex((t) => t.id === id);
      if (index > -1) {
        toasts.splice(index, 1);
        notify();
      }
    }, 5000);
    
    return {
      id,
      dismiss: () => {
        const index = toasts.findIndex((t) => t.id === id);
        if (index > -1) {
          toasts.splice(index, 1);
          notify();
        }
      },
    };
  };

  return {
    toast,
  };
}


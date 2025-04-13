
import { toast as sonnerToast, type ToastT as SonnerToast } from 'sonner';
import { uniqueToast } from '@/lib/toast';

type ToastOptions = {
  id?: string;
  description?: string; 
  title?: string;
  action?: React.ReactNode;
  cancel?: React.ReactNode;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  variant?: "default" | "destructive";
};

// Export from use-toast.ts to maintain compatibility
export { useToast } from "@/hooks/use-toast";

// Simple wrapper around Sonner toast
export const toast = (options: ToastOptions) => {
  return uniqueToast.info(options.title || '', {
    description: options.description,
    action: options.action,
    cancel: options.cancel,
    duration: options.duration,
    id: options.id,
    position: options.position,
  });
};

// Add variants for easier usage
toast.success = (message: string, options?: Omit<ToastOptions, 'title'>) => {
  return uniqueToast.success(message, {
    duration: 3000,
    ...options
  });
};

toast.error = (message: string, options?: Omit<ToastOptions, 'title'>) => {
  console.error("Toast error:", message); // Log errors for debugging
  return uniqueToast.error(message, {
    duration: 5000, // Show errors a bit longer
    ...options
  });
};

toast.info = (message: string, options?: Omit<ToastOptions, 'title'>) => {
  return uniqueToast.info(message, {
    duration: 3000,
    ...options
  });
};

toast.warning = (message: string, options?: Omit<ToastOptions, 'title'>) => {
  return uniqueToast.warning(message, {
    duration: 4000, // Show warnings a bit longer too
    ...options
  });
};

toast.dismiss = sonnerToast.dismiss;
toast.promise = sonnerToast.promise;
toast.custom = sonnerToast.custom;
toast.loading = sonnerToast.loading;

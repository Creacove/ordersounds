
import { toast as sonnerToast, type ToastT as SonnerToast } from 'sonner';

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
  return sonnerToast(options.title || '', {
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
  return sonnerToast.success(message, options);
};

toast.error = (message: string, options?: Omit<ToastOptions, 'title'>) => {
  console.error("Toast error:", message); // Log errors for debugging
  return sonnerToast.error(message, options);
};

toast.info = (message: string, options?: Omit<ToastOptions, 'title'>) => {
  return sonnerToast.info(message, options);
};

toast.warning = (message: string, options?: Omit<ToastOptions, 'title'>) => {
  return sonnerToast.warning(message, options);
};

toast.dismiss = sonnerToast.dismiss;
toast.promise = sonnerToast.promise;
toast.custom = sonnerToast.custom;
toast.loading = sonnerToast.loading;

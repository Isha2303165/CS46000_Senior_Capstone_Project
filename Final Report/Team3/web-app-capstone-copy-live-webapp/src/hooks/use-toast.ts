import { useToast as useToastContext } from '@/components/ui/toast';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const { addToast } = useToastContext();

  const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
    const type = variant === 'destructive' ? 'error' : 'success';
    return addToast({
      type,
      title,
      message: description || '',
    });
  };

  return { toast };
}
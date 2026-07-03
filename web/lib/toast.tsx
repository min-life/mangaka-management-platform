import { toast as sonnerToast } from 'sonner';
import type { ExternalToast } from 'sonner';
import { ToastCard } from '@/components/ui/toast-card';

/**
 * Inkly Toast utility — wraps sonner's toast.custom() so every toast renders
 * via ToastCard, which embeds a real <div> progress bar that:
 *   1. Lives inside the DOM → follows Sonner's CSS transforms correctly (no flyout bug)
 *   2. Pauses on hover via React state, staying in sync with Sonner's timer pause
 *
 * Usage (drop-in replacement for `import { toast } from 'sonner'`):
 *   import { toast } from '@/lib/toast';
 *   toast.success('Member invited.');
 *   toast.error('Something went wrong.', { description: 'Please try again.' });
 */

const DEFAULT_DURATION = 3000;
const ERROR_DURATION = 4000;

type ToastOptions = ExternalToast & { description?: string };

function show(
  type: 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading',
  message: string,
  options?: ToastOptions,
) {
  const duration =
    options?.duration !== undefined
      ? (options.duration as number)
      : type === 'error'
        ? ERROR_DURATION
        : DEFAULT_DURATION;

  return sonnerToast.custom(
    (id) => (
      <ToastCard
        description={options?.description}
        duration={duration}
        id={id}
        message={message}
        type={type}
      />
    ),
    { duration, ...options },
  );
}

export const toast = {
  /** Generic / default */
  message: (message: string, options?: ToastOptions) => show('default', message, options),

  /** ✅ Success — green */
  success: (message: string, options?: ToastOptions) => show('success', message, options),

  /** ❌ Error — red */
  error: (message: string, options?: ToastOptions) => show('error', message, options),

  /** ⚠️ Warning — amber */
  warning: (message: string, options?: ToastOptions) => show('warning', message, options),

  /** ℹ️ Info — blue */
  info: (message: string, options?: ToastOptions) => show('info', message, options),

  /** ⏳ Loading — spinner, no progress bar */
  loading: (message: string, options?: ToastOptions) => show('loading', message, options),

  /** Dismiss by id or all */
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),

  /** Promise helper */
  promise: sonnerToast.promise,
};

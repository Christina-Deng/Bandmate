import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type ToastMessage = {
  id: number;
  text: string;
  tone?: 'success' | 'warning';
};

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[300] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(() => onDismiss(toast.id), 200);
    }, 3200);
    return () => {
      cancelAnimationFrame(enter);
      window.clearTimeout(timer);
    };
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      className={`pointer-events-auto max-w-md rounded-xl border px-4 py-3 text-sm shadow-lg transition-all duration-200 ${
        toast.tone === 'warning'
          ? 'toast-default shadow-lg'
          : 'border-accent-600/40 bg-slate-900 text-emphasis shadow-accent-600/10'
      } ${visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
    >
      {toast.text}
    </div>
  );
}

let toastId = 0;

export function createToast(
  text: string,
  tone: ToastMessage['tone'] = 'success',
): ToastMessage {
  toastId += 1;
  return { id: toastId, text, tone };
}

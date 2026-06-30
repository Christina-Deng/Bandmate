import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  bandName: string;
  isLastMember: boolean;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function LeaveBandConfirmDialog({
  open,
  bandName,
  isLastMember,
  loading,
  error,
  onClose,
  onConfirm,
}: Props) {
  const openedAtRef = useRef(0);

  useEffect(() => {
    if (open) {
      openedAtRef.current = Date.now();
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  function handleBackdropClick() {
    // Ignore the click that opened the dialog (same event tick / ghost click).
    if (Date.now() - openedAtRef.current < 300) return;
    if (!loading) onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-labelledby="leave-band-title"
        aria-modal="true"
        className="dialog-panel w-full max-w-md rounded-xl p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="leave-band-title" className="text-lg font-semibold text-emphasis">
          确认退出乐队
        </h2>

        <p className="mt-3 text-sm text-slate-300">
          你即将退出乐队「<span className="font-semibold text-emphasis">{bandName}</span>」。
        </p>

        {isLastMember ? (
          <p className="dialog-callout mt-2 rounded-lg px-3 py-2 text-sm">
            你是最后一名成员，退出后乐队将被解散，此操作不可撤销。
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            退出后可以加入或创建其他乐队。你在该乐队的练习打卡记录将被清除。
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-accent-600/40 bg-accent-600/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500 disabled:opacity-50"
          >
            {loading ? '退出中…' : '确定退出'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

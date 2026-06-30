import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StyleMultiSelect } from '../shared/StyleMultiSelect';

interface Props {
  open: boolean;
  initialName: string;
  initialStylePreferences: string[];
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (input: { name: string; stylePreferences: string[] }) => void;
}

export function EditBandDialog({
  open,
  initialName,
  initialStylePreferences,
  loading,
  error,
  onClose,
  onSubmit,
}: Props) {
  const openedAtRef = useRef(0);
  const [name, setName] = useState(initialName);
  const [stylePreferences, setStylePreferences] = useState(initialStylePreferences);

  useEffect(() => {
    if (open) {
      openedAtRef.current = Date.now();
      setName(initialName);
      setStylePreferences(initialStylePreferences);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open, initialName, initialStylePreferences]);

  if (!open) return null;

  function handleBackdropClick() {
    if (Date.now() - openedAtRef.current < 300) return;
    if (!loading) onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ name: name.trim(), stylePreferences });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropClick}
    >
      <form
        role="dialog"
        aria-labelledby="edit-band-title"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="edit-band-title" className="text-lg font-semibold text-emphasis">
          编辑乐队资料
        </h2>
        <p className="mt-1 text-sm text-slate-400">所有成员均可修改队名和风格偏好。</p>

        <div className="mt-4 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-300">乐队名称</span>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <StyleMultiSelect
            label="乐队风格偏好（可选）"
            hint="用于歌单推荐筛选；未设置时会合并成员问卷中的风格"
            selected={stylePreferences}
            onChange={setStylePreferences}
          />
        </div>

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
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500 disabled:opacity-50"
          >
            {loading ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../hooks/useTheme';
import { THEMES, type ThemeId } from '../../lib/theme';

export function AppearanceMenu() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function selectTheme(next: ThemeId) {
    setTheme(next);
    setOpen(false);
  }

  function isInsideMenu(target: EventTarget | null) {
    if (!(target instanceof Node)) return false;
    return panelRef.current?.contains(target) || triggerRef.current?.contains(target);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-2.5 py-1.5 text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-emphasis"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="外观设置"
        title="外观"
      >
        <PaletteIcon />
        <span className="hidden text-xs font-medium sm:inline">外观</span>
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-start justify-end p-4 pt-14 sm:p-6 sm:pt-16"
            role="presentation"
            onMouseDown={(e) => {
              if (!isInsideMenu(e.target)) setOpen(false);
            }}
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-label="选择外观"
              className="w-full max-w-xs rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl"
            >
              <h2 className="font-display-heavy text-lg tracking-wide text-emphasis">外观</h2>
              <p className="mt-1 text-xs text-slate-400">选择配色方案，偏好会保存在本机</p>
              <ul className="mt-4 space-y-2">
                {THEMES.map((option) => {
                  const selected = theme === option.id;
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          selectTheme(option.id);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          selected
                            ? 'border-accent-600 bg-accent-600/10'
                            : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex overflow-hidden rounded-md border border-slate-600">
                          <span
                            className="h-8 w-8"
                            style={{ backgroundColor: option.swatches[0] }}
                          />
                          <span
                            className="h-8 w-8"
                            style={{ backgroundColor: option.swatches[1] }}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-emphasis">
                            {option.label}
                            {selected && (
                              <span className="ml-2 text-xs font-normal text-accent-500">当前</span>
                            )}
                          </span>
                          <span className="block text-xs text-slate-400">{option.description}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function PaletteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3c-4.97 0-9 3.582-9 8 0 2.21 1.79 4 4 4h1.5a2.5 2.5 0 0 0 0-5h-.5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h.5A6.5 6.5 0 0 1 18.5 9c0 3.59-2.91 6.5-6.5 6.5H12"
      />
      <circle cx="7.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

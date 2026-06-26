import { useEffect, useState, type ReactNode } from 'react';
import { Metronome } from './Metronome';
import { Tuner } from './Tuner';

export type PracticeToolId = 'metronome' | 'tuner';

const TOOLS: { id: PracticeToolId; label: string; short: string }[] = [
  { id: 'metronome', label: '节拍器', short: '拍' },
  { id: 'tuner', label: '调音器', short: '调' },
];

interface Props {
  children: ReactNode;
}

export function PracticeToolsLayout({ children }: Props) {
  const [activeTool, setActiveTool] = useState<PracticeToolId | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!activeTool) return undefined;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveTool(null);
        setMobileOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTool]);

  function openTool(id: PracticeToolId) {
    setActiveTool(id);
    setMobileOpen(true);
  }

  function closeTool() {
    setActiveTool(null);
    setMobileOpen(false);
  }

  function toggleTool(id: PracticeToolId) {
    if (activeTool === id && mobileOpen) {
      closeTool();
      return;
    }
    openTool(id);
  }

  const panelOpen = activeTool !== null;

  return (
    <div className="practice-tools-layout">
      <div className="practice-tools-main">{children}</div>

      {/* Desktop: fixed rail + slide panel */}
      <aside className="practice-tools-rail hidden xl:flex" aria-label="练习工具">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            title={tool.label}
            aria-label={tool.label}
            aria-pressed={activeTool === tool.id}
            onClick={() => toggleTool(tool.id)}
            className={`practice-tools-rail-btn ${
              activeTool === tool.id ? 'practice-tools-rail-btn-active' : ''
            }`}
          >
            <span className="practice-tools-rail-icon">{tool.short}</span>
            <span className="practice-tools-rail-label">{tool.label}</span>
          </button>
        ))}
      </aside>

      <div
        className={`practice-tools-panel hidden xl:block ${
          panelOpen ? 'practice-tools-panel-open' : ''
        }`}
        aria-hidden={!panelOpen}
      >
        <div className="practice-tools-panel-inner poster-card rounded-xl p-5">
          <button
            type="button"
            onClick={closeTool}
            className="mb-4 text-xs text-slate-500 hover:text-slate-300"
          >
            关闭 ✕
          </button>
          {activeTool === 'metronome' && <Metronome />}
          {activeTool === 'tuner' && <Tuner />}
        </div>
      </div>

      {/* Mobile / tablet: bottom bar + overlay panel */}
      <div className="practice-tools-mobile-bar xl:hidden">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            aria-pressed={activeTool === tool.id && mobileOpen}
            onClick={() => toggleTool(tool.id)}
            className={`practice-tools-mobile-btn ${
              activeTool === tool.id && mobileOpen ? 'practice-tools-mobile-btn-active' : ''
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {mobileOpen && activeTool && (
        <div className="practice-tools-mobile-overlay xl:hidden" role="presentation">
          <button
            type="button"
            className="practice-tools-mobile-backdrop"
            aria-label="关闭工具面板"
            onClick={closeTool}
          />
          <div className="practice-tools-mobile-sheet poster-card" role="dialog" aria-modal="true">
            <div className="mb-4 flex items-center justify-between">
              <p className="rock-kicker">TOOLS</p>
              <button
                type="button"
                onClick={closeTool}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                关闭
              </button>
            </div>
            {activeTool === 'metronome' && <Metronome />}
            {activeTool === 'tuner' && <Tuner />}
          </div>
        </div>
      )}
    </div>
  );
}

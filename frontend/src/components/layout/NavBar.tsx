import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AppearanceMenu } from './AppearanceMenu';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-lg text-sm font-semibold ${
    isActive
      ? 'bg-accent-600 text-white'
      : 'text-slate-300 hover:bg-slate-800 hover:text-emphasis'
  }`;

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-700 bg-slate-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-display-heavy text-3xl tracking-widest text-accent-600">BandMate</span>
          {user && (
            <nav className="flex gap-2">
              <NavLink to="/" end className={linkClass}>
                乐队
              </NavLink>
              <NavLink to="/songs" className={linkClass}>
                歌单
                <span className="ml-1 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                  即将上线
                </span>
              </NavLink>
              <NavLink to="/practice" className={linkClass}>
                打卡
              </NavLink>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <AppearanceMenu />
          {user && (
            <>
              <span className="font-display-heavy text-lg tracking-wide text-emphasis">
                {user.displayName}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-emphasis"
              >
                退出
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

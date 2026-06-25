import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-lg text-sm font-medium ${
    isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
  }`;

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-indigo-300">BandMate</span>
          {user && (
            <nav className="flex gap-2">
              <NavLink to="/" end className={linkClass}>
                乐队
              </NavLink>
              <NavLink to="/songs" className={linkClass}>
                歌单
                <span className="ml-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                  即将上线
                </span>
              </NavLink>
              <NavLink to="/practice" className={linkClass}>
                打卡
              </NavLink>
            </nav>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-400">{user.displayName}</span>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
            >
              退出
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

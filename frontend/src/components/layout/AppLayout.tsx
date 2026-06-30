import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { PosterBackground } from './PosterBackground';

export function AppLayout() {
  return (
    <div className="app-shell min-h-screen">
      <PosterBackground variant="app" />
      <NavBar />
      <main className="relative z-[1] mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

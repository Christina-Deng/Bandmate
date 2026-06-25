import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { BandProvider } from './hooks/useBand';
import { BandHomePage } from './pages/BandHome';
import { LoginPage } from './pages/Login';
import { PracticePage } from './pages/Practice';
import { RegisterPage } from './pages/Register';
import { SongRecommendPage } from './pages/SongRecommend';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-slate-400">加载中…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <BandProvider>
              <AppLayout />
            </BandProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<BandHomePage />} />
        <Route path="songs" element={<SongRecommendPage />} />
        <Route path="practice" element={<PracticePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

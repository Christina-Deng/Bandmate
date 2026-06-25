import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { AppearanceMenu } from '../components/layout/AppearanceMenu';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(getApiErrorMessage(err, '登录失败，请检查邮箱和密码'));
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="font-display-heavy text-2xl tracking-widest text-accent-600">BandMate</span>
        <AppearanceMenu />
      </div>
      <h1 className="mb-6 text-2xl font-bold">登录 BandMate</h1>
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-6">
        <input
          type="email"
          placeholder="邮箱"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="密码"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="w-full rounded-lg bg-accent-600 py-2 font-medium hover:bg-accent-500">
          登录
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-400">
        还没有账号？<Link to="/register" className="text-accent-500 hover:text-accent-400">注册</Link>
      </p>
    </div>
  );
}

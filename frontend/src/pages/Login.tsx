import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
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
    } catch {
      setError('登录失败，请检查邮箱和密码');
    }
  }

  return (
    <div className="mx-auto max-w-md">
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
        <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2 font-medium hover:bg-indigo-500">
          登录
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-400">
        还没有账号？<Link to="/register" className="text-indigo-300">注册</Link>
      </p>
    </div>
  );
}

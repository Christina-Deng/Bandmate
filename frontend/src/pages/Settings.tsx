import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { ThemePicker } from '../components/layout/ThemePicker';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

export function SettingsPage() {
  const { user, updateProfile, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (user) setDisplayName(user.displayName);
  }, [user]);

  if (!user) return null;

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileMessage('');
    try {
      await updateProfile({ displayName });
      setProfileMessage('昵称已更新');
    } catch (err) {
      setProfileError(getApiErrorMessage(err, '更新失败，请稍后重试'));
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMessage('密码已更新');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(getApiErrorMessage(err, '修改密码失败，请检查当前密码'));
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="账户设置" lead="管理昵称、密码与外观偏好" />

      <section className="poster-card space-y-3 rounded-xl p-5">
        <h2 className="section-title">个人资料</h2>
        <p className="text-sm text-slate-400">
          邮箱：<span className="text-slate-300">{user.email}</span>
        </p>
        <form onSubmit={handleProfileSubmit} className="space-y-3">
          <label className="block text-sm">
            昵称
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              required
            />
          </label>
          {profileError && <p className="text-sm text-red-400">{profileError}</p>}
          {profileMessage && <p className="text-sm text-accent-500">{profileMessage}</p>}
          <button
            type="submit"
            disabled={profileLoading || displayName.trim() === user.displayName}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500 disabled:opacity-50"
          >
            {profileLoading ? '保存中…' : '保存昵称'}
          </button>
        </form>
      </section>

      <section className="poster-card space-y-3 rounded-xl p-5">
        <h2 className="section-title">修改密码</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <label className="block text-sm">
            当前密码
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            新密码
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            确认新密码
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
          {passwordMessage && <p className="text-sm text-accent-500">{passwordMessage}</p>}
          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500 disabled:opacity-50"
          >
            {passwordLoading ? '更新中…' : '更新密码'}
          </button>
        </form>
      </section>

      <section className="poster-card space-y-3 rounded-xl p-5">
        <h2 className="section-title">外观</h2>
        <ThemePicker
          theme={theme}
          onSelect={setTheme}
          hint="保存在账户中，登录后各设备同步"
        />
      </section>

      <p className="text-center text-sm text-slate-500">
        <Link to="/" className="text-accent-500 hover:text-accent-400">
          返回首页
        </Link>
      </p>
    </div>
  );
}

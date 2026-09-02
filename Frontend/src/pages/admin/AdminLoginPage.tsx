import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import Spinner from '../../components/ui/Spinner';
import { ApiError } from '../../lib/api';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { status, login } = useAdminAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in → straight to dashboard
  if (status === 'authed') {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="rounded-2xl bg-white p-3 shadow-lift">
            <Logo className="h-8" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-neutral-400">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">Admin Dashboard</span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="animate-fade-up rounded-3xl bg-white p-6 shadow-lift"
        >
          <h1 className="font-display text-xl font-bold text-neutral-900">Sign in</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Use the admin credentials from your backend .env file.
          </p>

          <label className="mt-6 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              placeholder="admin"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Password
            </span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 pr-12 text-sm outline-none transition-all focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

          {error && (
            <p className="mt-4 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || status === 'checking'}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-4 font-display text-sm font-bold text-white shadow-lift transition-all duration-200 hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Spinner className="h-4 w-4" /> Signing in…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" /> Sign in
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-neutral-500 transition-colors hover:text-white">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}

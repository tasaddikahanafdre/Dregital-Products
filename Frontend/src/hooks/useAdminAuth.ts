import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export type AuthStatus = 'checking' | 'authed' | 'guest';

export function useAdminAuth() {
  const [status, setStatus] = useState<AuthStatus>('checking');

  const check = useCallback(async () => {
    try {
      await api.get('/admin/auth/me');
      setStatus('authed');
    } catch {
      setStatus('guest');
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const login = useCallback(async (username: string, password: string) => {
    await api.post('/admin/auth/login', { username, password });
    setStatus('authed');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/admin/auth/logout');
    } catch {
      // ignore — clear locally either way
    }
    setStatus('guest');
  }, []);

  return { status, login, logout };
}

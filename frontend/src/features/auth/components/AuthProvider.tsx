import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { refreshSession, setAccessToken, setSessionExpiredHandler } from '@/services/http';
import { authApi } from '../api/authApi';
import { AuthContext } from '../authContext';
import type { AuthContextValue, AuthResponse, AuthStatus, LoginRequest, RegisterRequest, User } from '../types';

interface AuthState {
  status: AuthStatus;
  user: User | null;
}

const ANONYMOUS: AuthState = { status: 'anonymous', user: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });

  const endSession = useCallback(() => {
    setAccessToken(null);
    queryClient.clear();
    setState(ANONYMOUS);
  }, [queryClient]);

  // Ao abrir a página, a sessão volta pelo cookie de refresh (ADR-0026)
  useEffect(() => {
    let active = true;
    setSessionExpiredHandler(endSession);
    refreshSession<AuthResponse>().then((session) => {
      if (active) setState(session ? { status: 'authenticated', user: session.user } : ANONYMOUS);
    });
    return () => {
      active = false;
      setSessionExpiredHandler(null);
    };
  }, [endSession]);

  const startSession = useCallback((response: AuthResponse) => {
    setAccessToken(response.accessToken);
    setState({ status: 'authenticated', user: response.user });
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => startSession(await authApi.login(data)),
    [startSession]
  );

  const register = useCallback(
    async (data: RegisterRequest) => startSession(await authApi.register(data)),
    [startSession]
  );

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    endSession();
  }, [endSession]);

  const updateUser = useCallback((user: User) => {
    setState((current) => (current.status === 'authenticated' ? { ...current, user } : current));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, logout, updateUser }),
    [state, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

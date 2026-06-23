import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { tokenStore } from '../../../services/api';
import type { LoginPayload, RegisterPayload, UserProfile, UpdateProfilePayload } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState<boolean>(() => !!tokenStore.getAccessToken());

  const { data: user, isLoading: isUserLoading, refetch } = useQuery<UserProfile, Error>({
    queryKey: ['currentUser'],
    queryFn: () => authApi.getCurrentUser(),
    enabled: hasToken,
    retry: false,
    staleTime: 1000 * 60 * 60, // cache for 1hr
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: async (data) => {
      tokenStore.setTokens(data.accessToken, data.refreshToken);
      setHasToken(true);
      await refetch();
    }
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => authApi.updateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
    }
  });

  const logout = () => {
    tokenStore.clearTokens();
    setHasToken(false);
    queryClient.setQueryData(['currentUser'], null);
    queryClient.clear();
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const login = async (payload: LoginPayload) => {
    await loginMutation.mutateAsync(payload);
  };

  const register = async (payload: RegisterPayload) => {
    await registerMutation.mutateAsync(payload);
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    await updateProfileMutation.mutateAsync(payload);
  };

  const isInitializing = hasToken && isUserLoading;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isAuthenticated,
        isInitializing,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

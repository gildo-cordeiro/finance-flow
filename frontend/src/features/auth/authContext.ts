import { createContext } from 'react';
import type { AuthContextValue } from './types';

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Versão da política de privacidade aceita no cadastro (RF-102); precisa ser igual a `APP_PRIVACY_VERSION` do backend. */
export const PRIVACY_VERSION: string = import.meta.env.VITE_PRIVACY_VERSION ?? '2026-10';

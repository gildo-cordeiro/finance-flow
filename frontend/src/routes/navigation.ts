import type { Location } from 'react-router-dom';

// Remove os avisos de migração do React Router v7
export const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

export interface RedirectState {
  from?: Pick<Location, 'pathname' | 'search' | 'hash'>;
}

/** Rota que o usuário tentou abrir antes de ser mandado para o login. */
export function redirectTarget(state: unknown): string {
  const from = (state as RedirectState | null)?.from;
  if (!from || from.pathname === '/entrar') return '/';
  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
}

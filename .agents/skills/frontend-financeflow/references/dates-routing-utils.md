# Datas, roteamento, Error Boundary e utilitários

> Referência da skill `frontend-financeflow`. Leia só quando a tarefa envolver este assunto. Regras gerais e convenções confirmadas: `../SKILL.md`.

## 6. Datas com date-fns

```typescript
// utils/formatters.ts
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Sempre importe funções individualmente — tree-shaking
export const formatDate = (iso: string) =>
  format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR });

export const formatMonth = (iso: string) =>
  format(parseISO(iso), 'MMMM yyyy', { locale: ptBR }); // "junho 2026"

export const formatMonthShort = (iso: string) =>
  format(parseISO(iso), 'MMM/yy', { locale: ptBR }); // "jun/26"

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Competência atual no formato "yyyy-MM"
export const currentCompetenceMonth = () =>
  format(startOfMonth(new Date()), 'yyyy-MM');

// Navegação de mês (para o seletor de competência)
export const previousMonth = (month: string) =>
  format(startOfMonth(parseISO(`${month}-01`)).setMonth(
    parseISO(`${month}-01`).getMonth() - 1
  ), 'yyyy-MM');
```

---

## 7. Roteamento Protegido (React Router v6)

```tsx
// routes/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/Skeleton';

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// routes/index.tsx
const router = createBrowserRouter([
  { path: '/login',    element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/',            element: <Dashboard /> },
      { path: '/transactions', element: <Transactions /> },
      { path: '/budget',       element: <Budget /> },
      { path: '/cashflow',     element: <CashFlow /> },
      { path: '/goals',        element: <Goals /> },
      { path: '/couple',       element: <Couple /> },
    ],
  },
]);
```

---

## 8. Error Boundary

Implementado em `src/components/ui/ErrorBoundary.tsx` (componente de classe, `fallback` opcional, botão 'Tentar novamente'). Veja o uso em `App.tsx` e `routes/ProtectedRoute.tsx` e os testes em `ErrorBoundary.test.tsx`. Para resetar ao navegar, use `key={pathname}` no ponto de uso. Envolva também blocos que podem falhar sozinhos (por exemplo gráficos) quando fizer sentido.

---

## 9. Utilitários Globais

```typescript
// lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```typescript
// types/api.ts — tipos compartilhados de API
export interface ApiError {
  code: string;
  message: string;
  errors?: { field: string; message: string }[];
}

export interface PaginatedResponse<T> {
  content: T[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

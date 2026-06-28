---
name: frontend-financeflow
description: >
  Guia completo de front-end para o FinanceFlow: sistema de design Dark Premium, componentes UI, formulários com
  React Hook Form + Zod, data fetching e cache com React Query (TanStack Query), roteamento com React Router v6,
  gráficos com Recharts, manipulação de datas com date-fns, e testes com Vitest + Testing Library.
  Use esta skill SEMPRE que o trabalho for exclusivamente de front-end: criar componentes React, estilizar com
  Tailwind, implementar formulários, hooks de dados, gráficos de fluxo de caixa/orçamento, animações, responsividade,
  sistema de design, tokens de cor, ou qualquer questão visual/UX do FinanceFlow.
  Acione também para: "como fica esse componente?", "estiliza isso", "cria o hook de dados", "adiciona validação
  no formulário", "como mostrar esse gráfico?", "dark mode", "glassmorphism", "violet", "toast", "modal",
  "skeleton loader", "empty state", "error boundary", "layout responsivo".
---

# Front-end FinanceFlow — Sistema de Design e Padrões de Implementação

Stack: **React 18 + Vite + TypeScript (strict) + Tailwind CSS v3.4.x + TanStack Query + React Router v6 + Recharts + date-fns**

---

## 1. Sistema de Design — Dark Premium

O FinanceFlow usa um tema escuro sofisticado. Todos os componentes devem seguir estes tokens rigorosamente.

### Paleta de Cores

| Papel | Token / Classe Tailwind | Valor HEX | Uso |
|---|---|---|---|
| Fundo base da página | `bg-bg-base` | `#0F1117` | Body / layout raiz |
| Fundo de cards | `bg-bg-surface` | `#1A1D27` | Cards, painéis, sidebars |
| Fundo elevado / hover | `bg-bg-elevated` | `#21253A` | Modais, dropdowns, hover states |
| Borda sutil | `border-border-subtle` | `#2A2E45` | Divisores, cards |
| Destaque principal (Brand) | `text-brand` / `bg-brand` | `#7C5CFC` | CTAs, links ativos, badges principais |
| Destaque hover | `bg-brand-hover` | `#6B4EE6` | Hover de botões/links brand |
| Sucesso | `text-success` / `bg-success` | `#22C55E` | Receitas, PAID, positivo, limites saudáveis |
| Perigo | `text-danger` / `bg-danger` | `#EF4444` | OVERDUE, despesas, negativos, acima do limite |
| Atenção | `text-warning` / `bg-warning` | `#F59E0B` | PENDING, alertas, sem limite definido |
| Neutro informativo | `text-info` / `bg-info` | `#3B82F6` | PLANNED, informações neutras |
| Texto primário | `text-text-primary` | `#F1F5F9` | Títulos, valores principais |
| Texto secundário | `text-text-secondary` | `#94A3B8` | Labels secundários, descrições |
| Texto muted | `text-text-muted` | `#4B5563` | Sublabels, placeholders, hints, labels de card uppercase |

### Tipografia

| Token | Tamanho / Estilo | Uso |
|---|---|---|
| `text-value-xl` | 28px, LineHeight 1.2, Bold (700) | Valores monetários grandes |
| `text-label-xs` | 11px, LineHeight 1.4, Medium (500), tracking 0.08em | Labels uppercase tracking |
| `text-section` | 18px, LineHeight 1.4, SemiBold (600) | Títulos de seção |
| `text-body` | 14px, LineHeight 1.6, Regular (400) | Corpo, tabelas, parágrafos |
| `text-hint` | 12px, LineHeight 1.5, Regular (400) | Sublabels, hints secundários |

### Regras Visuais

- **Nunca usar preto absoluto `#000` como fundo** — usar sempre `bg-bg-base`.
- **Nunca usar shadow em cards** — usar sempre `border border-border-subtle`.
- **Valores monetários sempre com `<MoneyValue>`** — nunca cor hardcoded ou formatação inline.
- **Labels de card sempre uppercase** — usar `<SectionLabel>`.
- **ProgressBar sempre com os 3 estados** — nunca omitir o estado "sem limite".

---

## 2. Componentes Base

### Button

```tsx
// components/ui/Button.tsx
import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900',
        // Variantes
        variant === 'primary'   && 'bg-violet-600 text-white hover:bg-violet-500 focus:ring-violet-500 shadow-lg shadow-violet-500/25',
        variant === 'secondary' && 'bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 focus:ring-zinc-600',
        variant === 'ghost'     && 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 focus:ring-zinc-700',
        variant === 'danger'    && 'bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 focus:ring-red-500',
        // Tamanhos
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        // Estados
        (disabled || loading) && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}
```

### Input

```tsx
// components/ui/Input.tsx
import { cn } from '@/lib/cn';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-xl bg-zinc-800/50 border px-3.5 py-2.5 text-sm text-zinc-100',
          'placeholder:text-zinc-500 transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
            : 'border-zinc-700/50 focus:border-violet-500 focus:ring-violet-500/20',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
```

### Card

```tsx
// components/ui/Card.tsx
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('bg-bg-surface border border-border-subtle rounded-xl p-5', className)}
      {...props}
    >
      {children}
    </div>
  )
);
```

### Badge

```tsx
// components/ui/Badge.tsx
import { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type TransactionStatus = 'PLANNED' | 'PAID' | 'PENDING' | 'OVERDUE';

const STATUS_CONFIG: Record<TransactionStatus, { label: string; classes: string }> = {
  PLANNED: { label: 'Planejado', classes: 'bg-info/10 text-info border-info/20' },
  PAID:    { label: 'Pago',      classes: 'bg-success/10 text-success border-success/20' },
  PENDING: { label: 'Pendente',  classes: 'bg-warning/10 text-warning border-warning/20' },
  OVERDUE: { label: 'Atrasado',  classes: 'bg-danger/10 text-danger border-danger/20' },
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: TransactionStatus;
}

export function Badge({ status, className, children, ...props }: BadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, classes: 'bg-bg-elevated text-text-secondary border-border-subtle' };
  return (
    <span className={cn('inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold border', config.classes, className)} {...props}>
      {children || config.label}
    </span>
  );
}
```

### ProgressBar

```tsx
// components/ui/ProgressBar.tsx
import { cn } from '../../lib/cn';

interface ProgressBarProps {
  value: number;
  max?: number | null;
  className?: string;
}

export function ProgressBar({ value, max, className }: ProgressBarProps) {
  const hasLimit = typeof max === 'number' && max > 0;
  let percentage = 0;
  let isOverLimit = false;

  if (hasLimit && max) {
    percentage = Math.round((value / max) * 100);
    isOverLimit = value > max;
  }

  return (
    <div className={cn('space-y-1.5 w-full', className)}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-text-secondary font-medium">Progresso</span>
        <span className={cn('font-semibold', !hasLimit && 'text-warning', hasLimit && !isOverLimit && 'text-success', hasLimit && isOverLimit && 'text-danger')}>
          {hasLimit ? `${percentage}%` : 'Sem limite'}
        </span>
      </div>
      {hasLimit ? (
        <div className="w-full bg-bg-elevated h-2 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-300', isOverLimit ? 'bg-danger' : 'bg-success')} style={{ width: `${Math.min(percentage, 100)}%` }} />
        </div>
      ) : (
        <div className="w-full border border-dashed border-warning/40 bg-warning/5 h-2 rounded-full" />
      )}
    </div>
  );
}
```

### MoneyValue

```tsx
// components/ui/MoneyValue.tsx
import { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../utils/formatters';

interface MoneyValueProps extends HTMLAttributes<HTMLSpanElement> {
  amount: number;
  showSign?: boolean;
}

export function MoneyValue({ amount, showSign = true, className, ...props }: MoneyValueProps) {
  let colorClass = 'text-text-primary';
  let formattedValue = '';

  const absValue = Math.abs(amount);
  const formattedAbs = formatCurrency(absValue);

  if (amount > 0) {
    colorClass = 'text-success';
    formattedValue = showSign ? `+${formattedAbs}` : formattedAbs;
  } else if (amount < 0) {
    colorClass = 'text-danger';
    formattedValue = showSign ? `-${formattedAbs}` : formattedAbs;
  } else {
    colorClass = 'text-text-primary';
    formattedValue = formattedAbs;
  }

  return (
    <span className={cn('font-semibold tabular-nums', colorClass, className)} {...props}>
      {formattedValue}
    </span>
  );
}
```

### SectionLabel

```tsx
// components/ui/SectionLabel.tsx
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

interface SectionLabelProps extends HTMLAttributes<HTMLSpanElement> {}

export const SectionLabel = forwardRef<HTMLSpanElement, SectionLabelProps>(
  ({ className, children, ...props }, ref) => (
    <span ref={ref} className={cn('text-label-xs text-text-muted uppercase tracking-widest', className)} {...props}>
      {children}
    </span>
  )
);
```

### Skeleton Loader

```tsx
// components/ui/Skeleton.tsx
import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-zinc-800/60', className)} />
  );
}

// Skeleton específico de card de transação
export function TransactionCardSkeleton() {
  return (
    <div className="glassmorphism p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-24" />
    </div>
  );
}
```

### Empty State

```tsx
// components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 rounded-2xl bg-zinc-800/50 p-4 text-zinc-500">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-zinc-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

---

## 3. Formulários com React Hook Form + Zod

Sempre use **React Hook Form + Zod** para formulários. Nunca `useState` para controlar campos.

```tsx
// features/transactions/components/CreateTransactionForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateTransaction } from '../hooks/useCreateTransaction';

const schema = z.object({
  description: z.string().min(1, 'Descrição obrigatória').max(100),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  competenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  type: z.enum(['EXPENSE', 'INCOME']),
});

type FormData = z.infer<typeof schema>;

export function CreateTransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateTransaction();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    mutate(data, {
      onSuccess,
      onError: (err) => {
        // Mapeia erros de campo do backend para o formulário
        if (err.errors) {
          err.errors.forEach(({ field, message }) => {
            setError(field as keyof FormData, { message });
          });
        }
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Descrição"
        placeholder="Ex: Mercado, Salário..."
        error={errors.description?.message}
        {...register('description')}
      />
      <Input
        label="Valor (R$)"
        type="number"
        step="0.01"
        placeholder="0,00"
        error={errors.amount?.message}
        {...register('amount')}
      />
      <Input
        label="Data de Competência"
        type="date"
        error={errors.competenceDate?.message}
        {...register('competenceDate')}
      />
      <Button type="submit" loading={isPending} className="w-full">
        Salvar Transação
      </Button>
    </form>
  );
}
```

---

## 4. Data Fetching com React Query

### Configuração global (`App.tsx`)

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 min
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}
```

### Padrão de Query Hook

```typescript
// features/transactions/hooks/useTransactions.ts
import { useQuery } from '@tanstack/react-query';
import { transactionApi } from '../api/transactionApi';
import type { Transaction } from '@/types/transaction';

interface UseTransactionsParams {
  month: string; // "yyyy-MM"
  viewContext?: 'PERSONAL' | 'COUPLE';
}

export function useTransactions({ month, viewContext = 'PERSONAL' }: UseTransactionsParams) {
  return useQuery<Transaction[]>({
    queryKey: ['transactions', { month, viewContext }],
    queryFn: () => transactionApi.list({ month, viewContext }),
    enabled: !!month,
  });
}
```

### Padrão de Mutation Hook (com invalidação)

```typescript
// features/transactions/hooks/useCreateTransaction.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../api/transactionApi';
import type { CreateTransactionRequest, Transaction, ApiError } from '@/types';

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation<Transaction, ApiError, CreateTransactionRequest>({
    mutationFn: transactionApi.create,
    onSuccess: (data) => {
      // Invalida a listagem do mês de competência afetado
      const month = data.competenceDate.slice(0, 7); // "yyyy-MM"
      queryClient.invalidateQueries({ queryKey: ['transactions', { month }] });
      queryClient.invalidateQueries({ queryKey: ['budget', month] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
    },
  });
}
```

### Camada de API (service)

```typescript
// features/transactions/api/transactionApi.ts
import type { Transaction, CreateTransactionRequest } from '@/types/transaction';
import { handleResponse } from '@/lib/api';

const BASE = '/api/v1/transactions';

export const transactionApi = {
  list: async (params: { month: string; viewContext?: string }): Promise<Transaction[]> => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${BASE}?${qs}`, {
      headers: { 'X-View-Context': params.viewContext ?? 'PERSONAL' },
    });
    return handleResponse<Transaction[]>(res);
  },

  create: async (data: CreateTransactionRequest): Promise<Transaction> => {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Transaction>(res);
  },
};

// lib/api.ts — handleResponse reutilizável
export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: unknown = await res.json().catch(() => ({}));
    throw error; // deixa o React Query capturar e tipar como ApiError
  }
  return res.json() as Promise<T>;
}
```

### Usando no componente

```tsx
export function TransactionList({ month }: { month: string }) {
  const { data, isLoading, isError, error } = useTransactions({ month });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <TransactionCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Erro ao carregar transações"
        description={error?.message}
        action={<Button variant="secondary" size="sm" onClick={() => window.location.reload()}>Tentar novamente</Button>}
      />
    );
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="Nenhuma transação neste mês"
        description="Adicione sua primeira transação para começar."
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.map((tx) => (
        <TransactionCard key={tx.id} transaction={tx} />
      ))}
    </div>
  );
}
```

---

## 5. Gráficos com Recharts (Tema Dark)

Sempre use `ResponsiveContainer`. Adapte as cores ao tema Dark Premium.

```tsx
// features/cashflow/components/CashFlowChart.tsx
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { formatCurrency } from '@/utils/formatters';

interface ChartData {
  month: string;    // "Jun", "Jul"...
  receitas: number;
  despesas: number;
  saldo: number;
}

export function CashFlowChart({ data }: { data: ChartData[] }) {
  return (
    <div className="glassmorphism p-5 shadow-xl shadow-black/40">
      <h3 className="text-sm font-semibold text-zinc-100 mb-5">Fluxo de Caixa</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f87171" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#52525b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#71717a' }}
            />
            <YAxis
              stroke="#52525b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#71717a' }}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#f4f4f5',
              }}
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#a1a1aa' }}
            />
            <Area type="monotone" dataKey="receitas" name="Receitas"
              stroke="#10b981" fill="url(#gradReceitas)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="despesas" name="Despesas"
              stroke="#f87171" fill="url(#gradDespesas)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

---

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

```tsx
// components/ui/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="glassmorphism p-8 text-center space-y-4">
          <p className="text-sm text-zinc-400">Algo deu errado neste componente.</p>
          <Button variant="secondary" size="sm" onClick={() => this.setState({ hasError: false })}>
            Tentar novamente
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

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

---

## 10. Testes (Vitest + Testing Library)

```tsx
// Wrapper reutilizável com todos os providers
function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

// Teste de componente visual
describe('StatusBadge', () => {
  it.each([
    ['PAID',    'Pago'],
    ['PENDING', 'Pendente'],
    ['OVERDUE', 'Atrasado'],
    ['PLANNED', 'Planejado'],
  ] as const)('should render correct label for %s', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

// Teste de formulário
it('should show validation error when amount is negative', async () => {
  renderWithProviders(<CreateTransactionForm onSuccess={vi.fn()} />);

  await userEvent.type(screen.getByLabelText(/valor/i), '-10');
  await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

  expect(await screen.findByText('Valor deve ser positivo')).toBeInTheDocument();
});

// Seletores — ordem de preferência
// 1. getByRole()       → semântico e acessível (preferido)
// 2. getByLabelText()  → formulários
// 3. getByText()       → conteúdo visível
// 4. getByTestId()     → último recurso (data-testid no componente)
```

---

## 11. Checklist de Front-end

```
VISUAL (Dark Premium)
[ ] Fundo de page: gradient-bg / bg-zinc-950
[ ] Cards usam glassmorphism ou bg-zinc-900/60 + border-zinc-800
[ ] Textos: zinc-100 (primário), zinc-400 (secundário), zinc-500 (placeholder)
[ ] Destaques em violet-600/500; sucesso emerald; atenção amber; perigo red
[ ] Valores monetários com tabular-nums

COMPONENTES
[ ] Props tipadas com interface (nunca any)
[ ] Um componente por arquivo, nome = arquivo
[ ] forwardRef em inputs focusáveis
[ ] Estados: loading → skeleton, error → EmptyState com mensagem, empty → EmptyState

DADOS
[ ] React Query para todo fetch (nunca useState + useEffect para dados assíncronos)
[ ] queryKey estruturado e específico
[ ] invalidateQueries após mutação nos contextos afetados
[ ] Camada de API isolada em features/<modulo>/api/

FORMULÁRIOS
[ ] React Hook Form + Zod (nunca useState por campo)
[ ] Validação no schema Zod, não no onSubmit manual
[ ] Erros do backend mapeados com setError() por campo

ACESSIBILIDADE
[ ] Labels associados a inputs (htmlFor / label wrapping)
[ ] Botões com texto ou aria-label descritivo
[ ] Feedback de loading explícito (atributo disabled + spinner)

TAILWIND
[ ] Tailwind v3.4.x — nunca atualizar para v4
[ ] cn() para classes condicionais — nunca concatenação de string
[ ] Mobile-first (sem prefixo → md: → lg:)
[ ] Sem style={{}} inline
```

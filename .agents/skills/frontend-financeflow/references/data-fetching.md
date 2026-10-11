# Data fetching com React Query

> Referência da skill `frontend-financeflow`. Leia só quando a tarefa envolver este assunto. Regras gerais e convenções confirmadas: `../SKILL.md`.

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

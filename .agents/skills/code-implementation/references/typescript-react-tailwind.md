# TypeScript + React + Tailwind CSS — Referência Completa

## TypeScript: Configuração e Regras

### tsconfig.json — configuração strict obrigatória

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Tipos: regras fundamentais

```typescript
// ✅ Tipos explícitos e restritivos
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DELIVERED';

interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string; // ISO 8601
}

interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

// ✅ Tipos derivados — reutilize o que já existe
type CreateOrderPayload = Omit<Order, 'id' | 'createdAt' | 'status'>;
type OrderSummary = Pick<Order, 'id' | 'status' | 'createdAt'>;

// ✅ Discriminated unions para estados
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// ❌ PROIBIDO: any, type assertions desnecessárias
const data: any = fetchData();           // nunca
const user = response as User;           // só se inevitável, documente o motivo
```

### Type Guards

```typescript
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

// Uso
try {
  await createOrder(payload);
} catch (err) {
  if (isApiError(err)) {
    // err.code e err.message são seguros aqui
    setError(err.message);
  }
}
```

---

## React: Padrões de Componente

### Estrutura de arquivo

```tsx
// UserCard.tsx — um componente por arquivo, nome = arquivo

// 1. Imports externos
import { useState } from 'react';

// 2. Imports internos (alias @/)
import { cn } from '@/lib/cn';
import type { User } from '@/types/user';

// 3. Tipos locais
interface UserCardProps {
  user: User;
  onEdit?: (id: string) => void;
  className?: string;
}

// 4. Componente — export nomeado, nunca default de função anônima
export function UserCard({ user, onEdit, className }: UserCardProps) {
  // 5. Hooks no topo (sem condicionais)
  const [expanded, setExpanded] = useState(false);

  // 6. Handlers nomeados
  const handleEditClick = () => {
    onEdit?.(user.id);
  };

  // 7. Render
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      {/* ... */}
    </div>
  );
}
```

### Props: padrões importantes

```typescript
// ✅ Props opcionais com valor padrão via destructuring
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  onClick,
}: ButtonProps) { ... }

// ✅ Forwarding ref quando necessário (inputs, focusable)
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        ref={ref}
        className={cn(
          'rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2',
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
);
Input.displayName = 'Input';
```

### Quando criar componentes

| Situação | Ação |
|---|---|
| JSX com > ~50 linhas | Extrair componente |
| Mesmo JSX em 2+ lugares | Extrair componente |
| Estado que só serve a uma parte | Extrair componente com o estado |
| Prop drilling de > 2 níveis | Avaliar Context ou composição |

---

## Hooks e Estado de Servidor (React Query / TanStack Query)

Sempre utilize **React Query (TanStack Query)** para lidar com dados assíncronos vindos da API. Não crie lógica customizada com `useState` + `useEffect` para fazer fetchs.

### 1. Configuração do Query Client (`App.tsx`)
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutos
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

### 2. Custom Hook de Consulta (`useQuery`)
```typescript
// hooks/useOrder.ts
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import type { Order } from '@/types/order';

export function useOrder(id: string) {
  return useQuery<Order, Error>({
    queryKey: ['order', id],
    queryFn: () => orderService.getById(id),
    enabled: !!id, // só executa se tiver ID
  });
}
```

### 3. Custom Hook de Mutação com Invalidação de Cache (`useMutation`)
```typescript
// hooks/useCreateOrder.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import type { Order, CreateOrderPayload, ApiError } from '@/types/order';

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation<Order, ApiError, CreateOrderPayload>({
    mutationFn: (payload) => orderService.create(payload),
    onSuccess: () => {
      // Invalida o cache e força a atualização da listagem de pedidos
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
```

### Regras de hooks e cache:
- Nome sempre começa com `use`.
- **Nunca** chame hooks dentro de condicionais, loops ou callbacks.
- Sempre defina `queryKey` estruturado (ex: `['transactions', { type: 'receita' }]`).
- Invalide queries relevantes no callback `onSuccess` de mutações para manter a interface atualizada.

---

## Roteamento (React Router v6)

Roteamento SPA utilizando `react-router-dom` v6 com proteção de rotas privadas via componente Wrapper.

```tsx
// routes/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <div>Carregando...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// routes/index.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Dashboard } from '@/pages/Dashboard';
import { Login } from '@/pages/Login';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
    ],
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
```

---

## Visualização de Dados (Recharts)

Use Recharts para renderizar gráficos interativos e responsivos. Sempre utilize `ResponsiveContainer` para garantir o comportamento fluido em diferentes resoluções.

```tsx
// components/feature/FinancialSummaryChart.tsx
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';

interface ChartData {
  name: string;
  receitas: number;
  despesas: number;
}

interface FinancialSummaryChartProps {
  data: ChartData[];
}

export function FinancialSummaryChart({ data }: FinancialSummaryChartProps) {
  return (
    <div className="h-80 w-full rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Resumo Mensal</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
          <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}
            cursor={{ fill: '#F9FAFB' }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
          <Bar dataKey="receitas" fill="#10B981" radius={[4, 4, 0, 0]} name="Receitas" />
          <Bar dataKey="despesas" fill="#EF4444" radius={[4, 4, 0, 0]} name="Despesas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## Manipulação de Datas (date-fns)

Utilize `date-fns` para lidar com a formatação e manipulação de datas, especialmente para a lógica de competência de ciclos de fatura de cartões de crédito e orçamentos mensais. Importe funções individuais para permitir tree-shaking eficiente.

```typescript
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Formatação simples para o usuário
export function formatToUserDate(isoString: string): string {
  return format(parseISO(isoString), 'dd/MM/yyyy', { locale: ptBR });
}

// Lógica de verificação de competência
export function isTransactionInCompetence(transactionDate: string, competenceMonth: string): boolean {
  // competenceMonth format: "yyyy-MM" (e.g. "2026-06")
  const date = parseISO(transactionDate);
  const targetMonth = parseISO(`${competenceMonth}-01`);
  
  return isWithinInterval(date, {
    start: startOfMonth(targetMonth),
    end: endOfMonth(targetMonth)
  });
}
```

---

## Camada de Serviço (HTTP)

```typescript
// services/orderService.ts

const BASE_URL = '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: unknown = await res.json().catch(() => ({}));
    if (isApiError(error)) throw error;
    throw { code: 'HTTP_ERROR', message: `HTTP ${res.status}` };
  }
  return res.json() as Promise<T>;
}

export const orderService = {
  async getById(id: string): Promise<Order> {
    const res = await fetch(`${BASE_URL}/orders/${id}`);
    return handleResponse<Order>(res);
  },

  async create(payload: CreateOrderPayload): Promise<Order> {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Order>(res);
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const res = await fetch(`${BASE_URL}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Order>(res);
  },
};
```

---

## Tailwind CSS: Regras e Padrões

### Setup obrigatório: `cn()` helper

```typescript
// lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Classes condicionais

```tsx
// ✅ BOM: cn() com objeto para condições
<button
  className={cn(
    // Base — sempre presente
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    // Variante
    variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
    variant === 'secondary' && 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
    // Tamanho
    size === 'sm' && 'px-3 py-1.5 text-sm',
    size === 'md' && 'px-4 py-2 text-sm',
    size === 'lg' && 'px-6 py-3 text-base',
    // Estado
    disabled && 'cursor-not-allowed opacity-50',
    // Override externo
    className
  )}
>
```

### Paleta e design tokens

- Use as cores semânticas do Tailwind: `gray-{50-950}`, `blue-{50-950}`, `red-{50-950}`
- Para textos: `text-gray-900` (primário), `text-gray-600` (secundário), `text-gray-400` (placeholder)
- Para borders: `border-gray-200` (padrão), `border-gray-300` (hover/focus)
- Para fundos: `bg-white` (card), `bg-gray-50` (page), `bg-gray-100` (disabled)
- Shadows: `shadow-sm` (card), `shadow-md` (dropdown/modal), `shadow-lg` (toast)

### Responsividade

```tsx
// Mobile-first sempre — comece sem prefixo, adicione md: lg: xl: para telas maiores
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* ... */}
</div>

// ❌ NUNCA: style={{ display: 'grid' }} — resolva no Tailwind
```

### Proibições

- `style={{}}` inline — use Tailwind
- `!important` — resolva com especificidade ou `cn()` + tailwind-merge
- Classes arbitrárias sem motivo: `w-[347px]` — prefira valores do sistema (`w-80`, `w-96`)
- Strings de classe concatenadas: `"text-" + color` — Tailwind não purga dinamicamente

---

## Formulários

```tsx
// Com react-hook-form + zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type LoginFormData = z.infer<typeof schema>;

export function LoginForm({ onSubmit }: { onSubmit: (data: LoginFormData) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="E-mail"
        type="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Senha"
        type="password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
```

---

## Testes (Vitest + Testing Library)

### Setup

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
```

### Padrões de teste

```tsx
// Renderização com providers customizados
function renderWithProviders(ui: ReactElement) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {ui}
    </QueryClientProvider>
  );
}

// Teste de componente
describe('OrderStatusBadge', () => {
  it('should display correct label for each status', () => {
    const cases: [OrderStatus, string][] = [
      ['PENDING', 'Aguardando'],
      ['CONFIRMED', 'Confirmado'],
      ['CANCELLED', 'Cancelado'],
    ];

    cases.forEach(([status, label]) => {
      const { unmount } = render(<OrderStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });
});

// Teste de interação
it('should submit form with correct data', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(<LoginForm onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText(/e-mail/i), 'gildo@test.com');
  await userEvent.type(screen.getByLabelText(/senha/i), 'minhasenha123');
  await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'gildo@test.com',
      password: 'minhasenha123',
    });
  });
});

// Teste de hook com MSW e React Query
it('should set error state when API returns 500', async () => {
  server.use(
    http.post('/api/v1/orders', () => HttpResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Server error' },
      { status: 500 }
    ))
  );

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(() => useCreateOrder(), { wrapper });

  act(() => {
    result.current.mutate({ customerId: '1', items: [] });
  });

  await waitFor(() => {
    expect(result.current.isError).toBe(true);
  });

  expect(result.current.error?.code).toBe('INTERNAL_ERROR');
});
```

### Seletores — preferência

```
1. getByRole()         — semântico, acessível
2. getByLabelText()    — formulários
3. getByText()         — conteúdo visível
4. getByTestId()       — último recurso (adicionar data-testid no componente)
```

---

## Organização de Imports

```typescript
// Ordem obrigatória (configure no eslint-plugin-import)
// 1. React
import { useState, useEffect } from 'react';

// 2. Libs externas
import { z } from 'zod';
import { useForm } from 'react-hook-form';

// 3. Alias internos (@/)
import { cn } from '@/lib/cn';
import type { Order } from '@/types/order';
import { orderService } from '@/services/orderService';

// 4. Relativos
import { OrderStatusBadge } from './OrderStatusBadge';
```

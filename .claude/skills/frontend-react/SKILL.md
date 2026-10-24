---
name: frontend-react
description: Padrões de desenvolvimento do frontend do FinanceFlow (React 18, Vite, TypeScript, Tailwind, TanStack Query, shadcn/ui). Use ao criar ou alterar qualquer código em frontend/ (tela, componente, hook, chamada de API, formulário, teste) e ao revisar código TypeScript/React do projeto.
---

# Frontend React do FinanceFlow

Escrita a partir da especificação, dos ADRs e de `docs/design-system.md` (ADR-0030). Quando esta skill e um ADR divergirem, vale o ADR. Textos da interface, mensagens e commits em português.

## Antes de escrever código

1. Ache os IDs da especificação (RF, RNF) e os ADRs que a tarefa toca. Consulte o contrato da API na documentação do OpenAPI (ADR-0033), não nos controllers.
2. Lembre que regra de negócio é do backend: o frontend exibe e sugere (ex.: competência sugerida), nunca decide (ADR-0017). Saldos, totais de fatura e realizado do orçamento vêm da API (ADR-0011).
3. Dependência nova no `package.json` pede avaliação de ADR (ADR-0030). Pergunte antes de adicionar.

## Onde cada coisa fica (ADR-0029)

```
src/features/<domínio>/
  api/         objeto com as chamadas HTTP da feature (ex.: transactionsApi)
  hooks/       hooks do TanStack Query (useTransactions, useCreateTransaction)
  components/  telas e componentes da feature
  schemas/     schemas Zod dos formulários
  types.ts     tipos de requisição e resposta da API
src/components/ui   componentes compartilhados (shadcn e de domínio: MoneyValue, ProgressBar...)
src/lib             utilitários sem React (cn, forms)
src/services        cliente HTTP (http.ts) e erros da API (errors.ts)
src/routes          rotas, ProtectedRoute, PublicOnlyRoute
src/utils           formatadores de data e moeda
```

- Importe pelo alias `@/` entre pastas; dentro da feature, caminho relativo (`../api/authApi`).
- Uma feature não importa o interno de outra. O que for comum sobe para `components/`, `lib/` ou `utils/`.
- Componente com mais de ~300 linhas é dividido.

## TypeScript

- `strict` está ligado: nada de `any`, `@ts-ignore` ou `as` para calar o compilador. Para dado desconhecido, use `unknown` e estreite o tipo.
- Tipos de formulário saem do schema: `type LoginForm = z.infer<typeof loginSchema>`.
- `import type` para importar só tipos.
- `interface` para props e formatos da API; `type` para uniões (`type Status = 'PAID' | 'PENDING' | 'OVERDUE' | 'PLANNED'`).
- Exports nomeados (`export function LoginPage()`), sem `export default`.

## Comunicação com a API

- Toda chamada passa por `request<T>()` de `@/services/http`. Nunca chame `fetch` direto: o cliente cuida do prefixo `/api/v1`, do access token, da renovação em 401 e da conversão do Problem Details em `ApiError`.
- O access token fica só em memória e o refresh token só em cookie `HttpOnly` (ADR-0026). Nunca guarde tokens nem dados financeiros em `localStorage` ou `sessionStorage`.
- Cada feature expõe um objeto em `api/`:

```ts
export const transactionsApi = {
  list: (month: string) => request<Transaction[]>(`/transactions?competence=${month}`),
  create: (data: CreateTransactionRequest) =>
    request<Transaction>('/transactions', { method: 'POST', body: data }),
};
```

- Visão Casal: o contexto vai no cabeçalho `X-View-Context` em cada requisição (ADR-0022). Ele entra no `services/http.ts`, uma vez só, não em cada objeto de `api/`.

## Estado do servidor (TanStack Query)

- Dado que vem da API vive no TanStack Query, não em `useState` nem em Context. Context guarda só o que é da sessão (usuário autenticado, contexto de visão).
- `queryKey` em array, começando pela feature e indo do geral ao específico: `['transactions', 'list', month]`. Assim `invalidateQueries({ queryKey: ['transactions'] })` alcança tudo da feature.
- Mutação invalida as consultas que ela afeta no `onSuccess`. Lembre das dependências entre domínios: criar uma transação muda saldo, orçamento e fatura.
- Um hook por consulta ou mutação em `hooks/`; o componente não chama `useQuery` com `queryFn` inline.
- Trate os três estados: carregando (`Skeleton`), erro (mensagem por `errorMessage`) e vazio (`EmptyState`).

## Formulários

- React Hook Form + Zod pelo `Form` do shadcn (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`), que liga rótulo, `aria-invalid` e mensagem ao campo (ADR-0032).
- O schema Zod só orienta quem digita (campo obrigatório, tamanho). A regra de verdade é do backend: não duplique políticas como a de senha.
- Erros da API:
  - campos recusados: `applyFieldErrors(error, form.setError, { campoNaApi: 'campoNoForm' })` de `@/lib/forms`;
  - mensagem geral: `errorMessage(error)` de `@/services/errors`, escolhida pelo `code` (ADR-0027). Ao tratar um `code` novo, adicione a mensagem ao mapa `MESSAGES`; nunca mostre o `detail` cru como texto principal.
- Toasts com `toast` do `sonner`.

## Dinheiro e datas

- Valor monetário na tela sempre por `<MoneyValue>` (cor pelo sinal) ou `formatCurrency`; nunca formate à mão nem pinte com cor fixa. Digitação de valor com `<CurrencyInput>`.
- Não some nem calcule totais financeiros no frontend: ponto flutuante erra centavos, e o valor oficial é o da API.
- Datas com `date-fns`. A API troca datas como `yyyy-MM-dd`: converta com `parseISO`, nunca `new Date('2026-10-01')`, que interpreta como UTC e pode mostrar o dia anterior no Brasil.
- Competência é sempre o dia 1 do mês (ADR-0007). Use os formatadores de `@/utils/formatters` (`formatMonth`, `currentCompetenceMonth`).
- Moeda única BRL, sem seletor (ADR-0015).

## Componentes e visual

- Componentes de função com props tipadas por `interface`. Repasse `className` e junte classes com `cn()`.
- Componentes básicos vêm do shadcn: `npx shadcn@2 add <componente>` (versão para Tailwind v3). Arquivos do shadcn em minúsculas (`button.tsx`); os nossos em PascalCase (`MoneyValue.tsx`). Nunca dois arquivos com o mesmo nome em caixas diferentes (ADR-0032).
- Siga `docs/design-system.md`:
  - só os tokens (`bg-bg-surface`, `text-text-label`, `text-success`...), nunca cores hex ou `#000`;
  - cards sem sombra, delimitados por `border border-border-subtle`;
  - texto com no mínimo 12px (nada de `text-[10px]`, `text-label-xs`);
  - títulos de card com `<SectionLabel>`, em sentence case;
  - orçamento sem limite mostra a barra tracejada do `<ProgressBar>`.
- Responsivo a partir de 360px (RNF-08): monte mobile primeiro e expanda com `sm:`/`md:`/`lg:`.
- Acessibilidade: elementos nativos (`button`, `a`, `label`) em vez de `div` com `onClick`; todo campo com rótulo; ícone sozinho com `aria-label`.
- Hooks: sem `useEffect` para derivar estado (calcule no render ou com `useMemo`) nem para buscar dados (use o TanStack Query). Respeite as regras do `eslint-plugin-react-hooks`.

## Testes (ADR-0023)

- Vitest + Testing Library + `user-event`. Teste o comportamento visível, não a implementação.
- Busque por papel e rótulo (`getByRole('button', { name: 'Entrar' })`, `getByLabelText('E-mail')`), não por classe nem `data-testid`.
- Telas: `renderApp(rota)` de `@/test/renderApp` com a API simulada por `stubFetch`, `json` e `noContent` de `@/test/fetchMock`. Confira o que o usuário vê e quais requisições saíram.
- Utilitários de data e moeda têm teste unitário próprio, incluindo virada de mês e de ano.

## Verificar antes de entregar

```bash
cd frontend
npm run lint && npm run test && npm run build   # o que o CI roda (o pre-push roda lint e testes)
```

Checklist:
- [ ] Código no lugar certo da feature; nenhum import do interno de outra feature.
- [ ] Chamadas por `request<T>()`; nenhum token em storage.
- [ ] Estado do servidor no TanStack Query, com invalidação nas mutações.
- [ ] Erros por `code` (`errorMessage`, `applyFieldErrors`).
- [ ] Dinheiro por `MoneyValue`/`formatCurrency`; datas por `parseISO`.
- [ ] Tokens do design system, texto ≥ 12px, funciona em 360px.
- [ ] Testes de comportamento escritos; lint, testes e build passam.

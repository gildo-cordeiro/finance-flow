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

---

## 0. Convenções confirmadas no código (leia antes de importar)

- **Alias `@/` → `src/`** está configurado (`resolve.alias` em `vite.config.ts` e `paths` em `tsconfig.app.json`; mantenha os dois em sincronia). Em código novo, prefira `@/...`; os imports relativos existentes não precisam ser migrados.
- **Locais reais dos utilitários:** `src/lib/cn.ts` (`cn`), `src/utils/formatters.ts` (`formatCurrency` e afins), `src/services/api.ts` (cliente HTTP; `handleResponse` fica nele, não em `lib/api`), `src/context/ToastContext.tsx` (`useToast`) e `src/context/ViewContext.tsx`.
- **Error Boundary:** `src/components/ui/ErrorBoundary.tsx`, usado em `App.tsx` (nível raiz, com fallback de recarregar) e em `routes/ProtectedRoute.tsx` (por página, com `key={pathname}` para resetar ao navegar).
- **Testes:** Vitest + Testing Library (`@testing-library/react`, `jest-dom`, `user-event`) com `jsdom`. Configuração em `vite.config.ts` (`test`) e `src/test/setup.ts`. Testes ficam ao lado do componente (`Componente.test.tsx`); exemplos: `ErrorBoundary.test.tsx`, `MoneyValue.test.tsx`.

---

## 1. Regras de ouro (design system)

Tokens, tipografia e componentes: `docs/design-system.md` (fonte de verdade) e `references/design-tokens.md`.

- **Nunca usar preto absoluto `#000` como fundo** — usar sempre `bg-bg-base`.
- **Nunca usar shadow em cards** — usar sempre `border border-border-subtle`.
- **Valores monetários sempre com `<MoneyValue>`** — nunca cor hardcoded ou formatação inline.
- **Labels de card via `<SectionLabel>`** — 13px, `font-semibold`, `text-text-label`, sem caixa alta. Texto nunca abaixo de 12px.
- **ProgressBar sempre com os 3 estados** — nunca omitir o estado "sem limite".

---

## 2. Onde está cada assunto (leia só o que a tarefa precisa)

| Assunto | Arquivo | Leia quando |
|---|---|---|
| Tokens, paleta e tipografia | `references/design-tokens.md` e `docs/design-system.md` (fonte de verdade) | Escolher cor, tamanho de texto, espaçamento |
| Componentes base (`Button`, `Input`, `Card`, `Badge`, `ProgressBar`, `MoneyValue`, `SectionLabel`, `Skeleton`, `EmptyState`) | `references/components.md` | Criar ou alterar componente de UI |
| Formulários (React Hook Form + Zod) | `references/forms.md` | Criar formulário, validação, máscara |
| Dados do servidor (React Query, camada de API) | `references/data-fetching.md` | Criar hook de query/mutation, chamada de API |
| Gráficos (Recharts, tema dark) | `references/charts.md` | Criar ou ajustar gráfico |
| Datas, roteamento protegido, Error Boundary, utilitários globais | `references/dates-routing-utils.md` | Mexer em datas, rotas, tratamento de erro de tela |
| Testes (Vitest + Testing Library) | `references/testing.md` | Escrever ou rodar testes de front |

> Os exemplos de código nas referências são ilustrativos: o código real em `src/` é a fonte de verdade. Em caso de divergência, siga o código e atualize a referência (skill `skill-maintenance`).

---

## 11. Checklist de Front-end

- [ ] Ao terminar: skill `skill-maintenance` (esta skill e `docs/design-system.md` continuam corretos?) e skill `adr-workflow` (houve decisão importante? consulte o desenvolvedor).

```
VISUAL (Dark Premium)
[ ] Fundo de página: bg-bg-base (o glow roxo vem do layout global, não da página)
[ ] Cards: bg-bg-surface + border border-border-subtle, sem shadow (use o componente Card)
[ ] Textos: text-text-primary, text-text-label e text-text-muted (nunca text-zinc-*)
[ ] Destaques em brand; semânticas success, danger, warning e info
[ ] Valores monetários com <MoneyValue> (já usa tabular-nums)

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

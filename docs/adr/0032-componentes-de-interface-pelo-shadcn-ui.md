# ADR-0032 — Componentes de interface pelo shadcn/ui

- Status: Aceito (substitui, no ADR-0018, só o item "componentes de `components/ui`")
- Data: 2026-10-24
- Origem do 'porquê': decisão do desenvolvedor durante a F1-08.

## Contexto

O ADR-0018 trouxe do projeto anterior o `components.json` do shadcn/ui e os componentes de `components/ui`. Só que esses componentes (`Button`, `Input`, `Card` e outros) eram próprios, não os do shadcn: tinham API diferente e cores fixas (`zinc`, `violet`) misturadas com os tokens HSL. O `Input` não ligava o `label` ao campo, o que atrapalhava a acessibilidade. A F1-08 é a primeira entrega com telas, e o desenvolvedor pediu um visual moderno com o shadcn.

## Decisão

- Os componentes básicos de interface vêm do shadcn/ui, na versão para Tailwind v3 e no estilo `default` do `components.json`. Os primitivos são do Radix.
- Os arquivos usam o nome que o CLI do shadcn gera, em minúsculas (`button.tsx`, `form.tsx`), para que `npx shadcn@2 add <componente>` funcione sem duplicar arquivos.
- Os componentes usam as variáveis HSL do `index.css` (`--primary`, `--card`, `--border`...), que já são a base dos tokens do design system. O tema escuro e as regras visuais continuam: cards sem sombra e texto com no mínimo 12 px.
- Formulários usam o `Form` do shadcn sobre React Hook Form e Zod. Toasts usam o `sonner`, com o `Toaster` do shadcn.
- `Button`, `Input` e `Card` antigos foram trocados pelos do shadcn. Os componentes de domínio do ADR-0018 (`MoneyValue`, `ProgressBar`, `Badge`, `CurrencyInput`, `PeriodSelector` e outros) continuam e passam a usar os componentes do shadcn quando forem mexidos.

## Consequências

- Componentes acessíveis (rótulos, `aria-invalid`, foco, teclado) e com o visual padrão do shadcn, sem reinventar.
- Componentes novos (diálogo, menu, select, tabela) entram pelo CLI em minutos.
- Novas dependências: `@radix-ui/react-label`, `-checkbox`, `-dialog`, `-avatar` e `sonner`. Cada componente novo pode trazer outro pacote do Radix.
- Enquanto a migração não termina, `components/ui` tem nomes em PascalCase (legado) e em minúsculas (shadcn). Não pode haver dois arquivos com o mesmo nome em caixas diferentes, porque isso quebra o Git no macOS e no Windows.
- O CLI atual do shadcn gera para Tailwind v4. Enquanto o projeto estiver no v3 (ADR-0018), use `shadcn@2`.
- Os testes precisam de um stub de `ResizeObserver` no jsdom (`src/test/setup.ts`).

## Alternativas consideradas

- Manter os componentes próprios do projeto anterior: API fora do padrão, acessibilidade incompleta e cores fixas.
- Outra biblioteca de componentes (MUI, Chakra, Mantine): traz um sistema de estilo próprio, que concorre com o Tailwind e com os tokens existentes.

## Evidências

- ADR-0017 (stack do frontend), ADR-0018 (base reaproveitada), ADR-0029 (organização por features)
- `docs/design-system.md`, `frontend/components.json`, `frontend/src/components/ui/`
- Card F1-08 · estrutura da aplicação, cliente HTTP e telas de login e cadastro

## Perguntas em aberto

- Migrar também `Select`, `Badge` e `Skeleton` para as versões do shadcn de uma vez, ou só quando forem usados?
- Ao migrar para o Tailwind v4 (pergunta em aberto do ADR-0018), atualizar os componentes pelo CLI atual do shadcn.

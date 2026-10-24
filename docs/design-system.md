# Design System — FinanceFlow

Este documento descreve as especificações visuais, tokens, componentes de UI e as regras visuais que regem a interface do FinanceFlow.

---

## 1. Paleta de Cores (Dark Premium)

A paleta de cores do FinanceFlow é projetada para oferecer uma experiência de tema escuro ("Dark Premium") moderna, sofisticada e de alta legibilidade.

| Token / Classe Tailwind | Valor HEX | Função e Semântica de Uso |
|---|---|---|
| `bg-bg-base` | `#0F1117` | Fundo principal da aplicação. Não é preto absoluto (`#000`), proporcionando profundidade sutil. |
| `bg-bg-surface` | `#1A1D27` | Fundo de contêineres principais (Cards, painéis e sidebars). |
| `bg-bg-elevated` | `#21253A` | Fundo de componentes suspensos e estados elevados (Dropdowns, modais, hover states). |
| `border-border-subtle` | `#2A2E45` | Borda sutil para contêineres e divisórias. Substitui sombras no design dark. |
| `bg-brand` / `text-brand` | `#7C5CFC` | Destaque primário (Brand/Roxo) — Usado para CTAs ativos, foco e links principais. |
| `bg-brand-hover` | `#6B4EE6` | Cor de hover para botões e elementos que usam a cor `brand`. |
| `text-success` / `bg-success` | `#22C55E` | Semântica de Sucesso (Verde) — Receitas, transações pagas (`PAID`), valores positivos, e limites saudáveis de orçamento. |
| `text-danger` / `bg-danger` | `#EF4444` | Semântica de Perigo (Vermelho) — Transações atrasadas (`OVERDUE`), despesas, valores negativos, e limites de orçamento estourados. |
| `text-warning` / `bg-warning` | `#F59E0B` | Semântica de Atenção (Âmbar) — Transações pendentes (`PENDING`), alertas, e limites de orçamento não configurados ("Sem limite"). |
| `text-info` / `bg-info` | `#3B82F6` | Semântica Informativa Neutra (Azul) — Transações planejadas (`PLANNED`). |
| `text-text-primary` | `#F4F5FA` | Texto principal (quase branco) para títulos e valores de destaque. |
| `text-text-label` | `#C4C8D8` | Rótulos de formulário e de card, descrições e textos auxiliares. |
| `text-text-secondary` | `#C4C8D8` | **Alias legado** de `text-text-label` (mantido por compatibilidade). Em código novo, use `text-text-label`. |
| `text-text-muted` | `#9AA0B4` | Texto silenciado para dicas, placeholders e metadados. Contraste mínimo de 4.5:1 sobre `bg-bg-surface`. |

---

## 2. Tipografia

A tipografia utiliza a fonte **Outfit** (ou **Inter** como fallback) para garantir excelente leitura de números (tabular-nums) e consistência visual.

| Token de Classe | Definição Tailwind | Casos de Uso |
|---|---|---|
| `text-value-xl` | `['28px', { lineHeight: '1.2', fontWeight: '700' }]` | Valores monetários principais e grandes. |
| `text-label-xs` | `['11px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.08em' }]` | **Legado — não usar em código novo** (11px está abaixo do mínimo de 12px). |
| `text-section` | `['18px', { lineHeight: '1.4', fontWeight: '600' }]` | Títulos de seções ou cabeçalhos de tabelas. |
| `text-body` | `['14px', { lineHeight: '1.6', fontWeight: '400' }]` | Texto corrido, conteúdo de tabelas e inputs. |
| `text-hint` | `['12px', { lineHeight: '1.5', fontWeight: '400' }]` | Notas secundárias e sub-labels. |

**Tamanho mínimo de texto: 12px** (`text-hint` ou `text-xs`). Não use `text-[8px]`, `text-[9px]`, `text-[10px]` nem `text-[11px]`.

---

## 3. Componentes Base e Exemplos de Código

### Componentes do shadcn/ui

Os componentes básicos (botão, campo, rótulo, checkbox, card, alerta, avatar, sheet, formulário e toasts) são os do shadcn/ui ([ADR-0032](adr/0032-componentes-de-interface-pelo-shadcn-ui.md)). Ficam em `components/ui` com nomes em minúsculas e usam as mesmas variáveis HSL desta paleta: `bg-primary` = `brand`, `bg-card` = `bg-surface`, `bg-popover` = `bg-elevated`, `border` = `border-subtle`, `text-muted-foreground` = `text-muted`. Para adicionar um componente novo, use `npx shadcn@2 add <componente>` (versão para Tailwind v3).

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

<Card>
  <CardHeader><CardTitle>Saldo</CardTitle></CardHeader>
  <CardContent>Conteúdo do card</CardContent>
</Card>

<Button variant="outline" onClick={() => toast.success('Salvo')}>Salvar</Button>
```

Formulários usam `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl` e `FormMessage` (`components/ui/form`) sobre React Hook Form e Zod. Assim o rótulo, o `aria-invalid` e a mensagem de erro já saem ligados ao campo.

### Badge

Badges semânticos baseados no status da transação.
```tsx
import { Badge } from '@/components/ui/Badge';

<Badge status="PAID" />      {/* Pago - Verde */}
<Badge status="PENDING" />   {/* Pendente - Amarelo */}
<Badge status="OVERDUE" />   {/* Atrasado - Vermelho */}
<Badge status="PLANNED" />   {/* Planejado - Azul */}
```

### ProgressBar

Barra de progresso flexível com tratamento automático para a ausência de limites.
```tsx
import { ProgressBar } from '@/components/ui/ProgressBar';

// 1. Sem limite definido (Amber tracejado)
<ProgressBar value={100} max={null} />

// 2. Dentro do limite (Verde sólido)
<ProgressBar value={80} max={100} />

// 3. Acima do limite (Vermelho sólido)
<ProgressBar value={120} max={100} />
```

### MoneyValue

Renderiza valores monetários com a formatação brasileira e com a cor adaptada dinamicamente com base no sinal do valor.
```tsx
import { MoneyValue } from '@/components/ui/MoneyValue';

<MoneyValue amount={150.00} />   {/* Renderiza (+R$ 150,00) em verde */}
<MoneyValue amount={-45.50} />   {/* Renderiza (-R$ 45,50) em vermelho */}
<MoneyValue amount={0.00} />     {/* Renderiza (R$ 0,00) em text-primary */}
```

### SectionLabel

Mini label padronizado para títulos de cards e campos (13px, `font-semibold`, `text-text-label`, sem caixa alta).
```tsx
import { SectionLabel } from '@/components/ui/SectionLabel';

<SectionLabel>Receitas do mês</SectionLabel>
```

### CurrencyInput

Campo de digitação de valor monetário de grande destaque (44px, `font-extrabold`) para modais e formulários rápidos, formando o valor por centavos e entregando número em reais.

```tsx
import { CurrencyInput } from '@/components/ui/CurrencyInput';

<CurrencyInput
  value={valorEmReais}
  onChange={(novoValor) => setValorEmReais(novoValor)}
  autoFocus
/>
```

---

## 4. Regras Visuais de Desenvolvimento

Ao construir ou modificar telas do FinanceFlow, observe rigorosamente as seguintes diretrizes:

1. **Sem Preto Absoluto**: Nunca use `#000` como plano de fundo. Utilize sempre o token `bg-bg-base`.
2. **Sem Sombras Desnecessárias**: Cards nunca devem utilizar classes de sombra (`shadow-xl`, etc.). O design é minimalista e flat dark, delimitado por `border border-border-subtle`. O `Card` do shadcn já vem sem sombra.
3. **Uso de MoneyValue**: Nunca formate valores monetários diretamente usando tags `<span>` ou aplicando cores hardcoded. Utilize sempre o componente `<MoneyValue>`.
4. **Sem Limite Definido**: Sempre inclua um estado visual claro para limites de orçamento ausentes através da barra tracejada no `<ProgressBar>`.
5. **Labels de Cards**: Todos os mini-títulos de cards devem usar `<SectionLabel>` (13px, `font-semibold`, `text-text-label`), em sentence case, sem `uppercase` nem `tracking-widest`.
6. **Texto secundário**: use `text-text-label` (descrições e rótulos) e `text-text-muted` (dicas e placeholders). `text-text-secondary` é um alias legado; não use em código novo.

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
| `text-text-primary` | `#F1F5F9` | Texto principal (quase branco) para títulos e valores de destaque. |
| `text-text-secondary` | `#94A3B8` | Texto secundário (cinza claro) para descrições, subtítulos e textos auxiliares. |
| `text-text-muted` | `#4B5563` | Texto silenciado (cinza escuro) para dicas, placeholders e labels menores. |

---

## 2. Tipografia

A tipografia utiliza a fonte **Outfit** (ou **Inter** como fallback) para garantir excelente leitura de números (tabular-nums) e consistência visual.

| Token de Classe | Definição Tailwind | Casos de Uso |
|---|---|---|
| `text-value-xl` | `['28px', { lineHeight: '1.2', fontWeight: '700' }]` | Valores monetários principais e grandes. |
| `text-label-xs` | `['11px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.08em' }]` | Mini títulos, metadados uppercase tracking. |
| `text-section` | `['18px', { lineHeight: '1.4', fontWeight: '600' }]` | Títulos de seções ou cabeçalhos de tabelas. |
| `text-body` | `['14px', { lineHeight: '1.6', fontWeight: '400' }]` | Texto corrido, conteúdo de tabelas e inputs. |
| `text-hint` | `['12px', { lineHeight: '1.5', fontWeight: '400' }]` | Notas secundárias e sub-labels. |

---

## 3. Componentes Base e Exemplos de Código

### Card

Componente padrão para agrupar informações sem a utilização de sombras.
```tsx
import { Card } from '@/components/ui/Card';

<Card className="hover:border-brand/20 transition-all duration-300">
  Conteúdo do Card
</Card>
```

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

Mini label para títulos uppercase padronizados.
```tsx
import { SectionLabel } from '@/components/ui/SectionLabel';

<SectionLabel>RECEITAS DO MÊS</SectionLabel>
```

---

## 4. Regras Visuais de Desenvolvimento

Ao construir ou modificar telas do FinanceFlow, observe rigorosamente as seguintes diretrizes:

1. **Sem Preto Absoluto**: Nunca use `#000` como plano de fundo. Utilize sempre o token `bg-bg-base`.
2. **Sem Sombras Desnecessárias**: Cards nunca devem utilizar classes de sombra (`shadow-xl`, etc.). O design é minimalista e flat dark, delimitado por `border border-border-subtle`.
3. **Uso de MoneyValue**: Nunca formate valores monetários diretamente usando tags `<span>` ou aplicando cores hardcoded. Utilize sempre o componente `<MoneyValue>`.
4. **Sem Limite Definido**: Sempre inclua um estado visual claro para limites de orçamento ausentes através da barra tracejada no `<ProgressBar>`.
5. **Labels de Cards**: Todos os mini-títulos de cards devem seguir a classe `text-label-xs text-text-muted uppercase tracking-widest` fornecida por `<SectionLabel>`.

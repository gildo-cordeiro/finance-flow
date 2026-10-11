# Sistema de Design — tokens, paleta e tipografia

> Referência da skill `frontend-financeflow`. Leia só quando a tarefa envolver este assunto. Regras gerais e convenções confirmadas: `../SKILL.md`.

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
| Texto primário | `text-text-primary` | `#F4F5FA` | Títulos, valores principais |
| Texto de label / secundário | `text-text-label` | `#C4C8D8` | Rótulos de formulário e de card, descrições |
| Alias legado | `text-text-secondary` | `#C4C8D8` | Mesmo valor de `text-text-label`; não usar em código novo |
| Texto muted | `text-text-muted` | `#9AA0B4` | Sublabels, placeholders, hints (contraste mínimo 4.5:1 sobre `bg-bg-surface`) |

### Tipografia

| Token | Tamanho / Estilo | Uso |
|---|---|---|
| `text-value-xl` | 28px, LineHeight 1.2, Bold (700) | Valores monetários grandes |
| `text-label-xs` | 11px, LineHeight 1.4, Medium (500), tracking 0.08em | **Legado — não usar em código novo** (abaixo do mínimo de 12px) |
| `text-section` | 18px, LineHeight 1.4, SemiBold (600) | Títulos de seção |
| `text-body` | 14px, LineHeight 1.6, Regular (400) | Corpo, tabelas, parágrafos |
| `text-hint` | 12px, LineHeight 1.5, Regular (400) | Sublabels, hints secundários |

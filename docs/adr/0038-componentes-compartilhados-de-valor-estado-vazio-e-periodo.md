# ADR-0038 — Componentes compartilhados para valor monetário, estado vazio e período

- Status: Aceito (retroativo)
- Data: 2026-10-10 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': Registrada nas issues e nos PRs #86 a #89; o detalhe de cada componente não foi relido neste ADR.

## Contexto

As telas definiam sozinhas a cor de valores, o estado vazio e o seletor de mês, gerando inconsistências visíveis na revisão de design.

## Decisão

- `MoneyValue` concentra a regra de cor de valores monetários (PR #86).
- `EmptyState` segue os tokens do design system e é aplicado no Dashboard e em Transações (PRs #87 e #88).
- Um seletor de período único substitui as variações por tela (PR #89).

## Consequências

- Telas novas devem usar esses componentes em vez de recriar o comportamento.
- Ajustes futuros de aparência acontecem em um lugar só.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `0f8ebe7`, `8bacfd5`, `e45c990`, `97120c3`
- PRs #86, #87, #88 e #89

## Perguntas em aberto

- Nenhuma.

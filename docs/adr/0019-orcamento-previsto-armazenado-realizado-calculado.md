# ADR-0019 — Orçamento: valor previsto armazenado, valor realizado calculado

- Status: Aceito (retroativo)
- Data: 2026-06-23 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': Documentada no PDF (§4.4); a implementação foi conferida só parcialmente.

## Contexto

O PDF (§4.4) define o orçamento mensal por categoria e diz que o valor realizado é calculado dinamicamente a partir das transações, e não armazenado.

## Decisão

A tabela `budgets` guarda `planned_amount` por usuário, categoria e mês (`UNIQUE (user_id, category_id, month)`). O realizado vem das transações. O cálculo foi ajustado para usar competência no commit `e9704b5` (`GetBudgetUseCase`).

## Consequências

- O realizado nunca fica defasado em relação às transações.
- Cada consulta de orçamento agrega transações; o PDF prevê cache (ADR-0015) para dashboards pesados.

## Alternativas consideradas

Armazenar o realizado: descartada no PDF (§4.4).

## Evidências

- Commits `913d742`, `e9704b5`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §4.4
- Migration `V4__create_budgets_table.sql`
- `GetBudgetUseCase.java`

## Perguntas em aberto

- Confirmar no código que o realizado usa exclusivamente `competence_date`.

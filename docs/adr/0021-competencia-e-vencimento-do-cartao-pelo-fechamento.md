# ADR-0021 — Competência e vencimento de cartão derivados do dia de fechamento

- Status: Aceito (retroativo)
- Data: 2026-06-26 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Requisito no PDF (§2.3); regras confirmadas no código. O commit `e9704b5` corrigiu o cálculo.

## Contexto

O PDF (§2.3) pede cálculo automático de competência baseado no dia de fechamento do cartão, com visão de fatura por ciclo.

## Decisão

Em `CreateTransactionUseCase`:
- Se o pedido informa a competência, ela é usada (normalizada para o dia 1).
- Senão, a data base da compra é o `dueDate` enviado pelo formulário. Para cartão com `closing_day`, compra até o dia de fechamento cai no mês da compra; depois, no mês seguinte. Contas comuns usam o mês da data.
- O vencimento da fatura usa `due_day`: se `due_day - closing_day` for menor que 7 (incluindo negativo), vence no mês seguinte à competência; caso contrário, no mesmo mês. Dias inexistentes são ajustados por `safeDateOf`.

## Consequências

- A competência de compras no cartão não depende de o usuário informar o mês da fatura.
- O campo `dueDate` do formulário funciona como 'data da compra' no fluxo de cartão, o que confunde o nome do campo.
- A regra do intervalo mínimo de 7 dias é uma heurística no código.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commit `e9704b5`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §2.3
- `CreateTransactionUseCase.java` (`calculateCompetenceDate`, `calculateDueDate`)
- `.agents/skills/temporal-competence/SKILL.md`

## Perguntas em aberto

- De onde vem a regra de 7 dias entre fechamento e vencimento? Motivação não documentada — confirmar com Gildo.

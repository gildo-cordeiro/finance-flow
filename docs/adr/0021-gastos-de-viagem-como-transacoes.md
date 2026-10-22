# ADR-0021 — Gastos de viagem são transações comuns ligadas à viagem

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (D-05, RF-080 a RF-085).

## Contexto

O modelo original tinha uma entidade `TravelExpense` separada, mas a especificação diz que o gasto de viagem também conta no orçamento mensal.

## Decisão

- Não existe `TravelExpense`. Um gasto de viagem é uma `Transaction` com `travel_id`.
- O orçamento da viagem por categoria fica em `TravelBudgetItem` (hospedagem, transporte, alimentação, passeios e outros).
- A viagem pode ter um objetivo de poupança ligado (`goal_id`).

## Consequências

- Gasto de viagem aparece no orçamento mensal, no fluxo de caixa e na fatura sem duplicar dados.
- O comparativo orçado × realizado da viagem é uma consulta por `travel_id`.

## Alternativas consideradas

- Tabela `TravelExpense` própria: duplicaria o lançamento ou deixaria o gasto fora do orçamento.

## Evidências

- Especificação: D-05, RF-080 a RF-085, Modelo de dados (Travel, Transaction)
- Projeto anterior: ADR antigo 0016 (viagens adiadas; só havia a pasta vazia)

## Perguntas em aberto

- Nenhuma.

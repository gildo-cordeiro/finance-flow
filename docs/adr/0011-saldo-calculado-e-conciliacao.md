# ADR-0011 — Saldo de conta calculado, com saldo do banco guardado à parte para conciliação

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RN-07, D-06, RF-010, RF-061, entidade AccountBalanceSnapshot).

## Contexto

O modelo original guardava `balance` na conta, o que deixa duas fontes de verdade (o campo e as transações). Com o Open Finance, o banco também informa um saldo.

## Decisão

- Saldo da conta = `initial_balance` + transações pagas da conta. Não é armazenado.
- O valor realizado do orçamento também é calculado, nunca armazenado.
- O saldo informado pelo banco é gravado em `AccountBalanceSnapshot` e comparado ao calculado; a diferença é exibida ao usuário.
- Se a consulta ficar lenta, cria-se cache (ADR-0006) ou uma tabela de saldo consolidado por mês, sem mudar a regra.

## Consequências

- Uma fonte de verdade: corrigir uma transação corrige o saldo.
- O cálculo cresce com o histórico; índices em `(account_id, status, payment_date)` são necessários desde a `V1`.

## Alternativas consideradas

- Saldo atualizado a cada lançamento: rápido, mas diverge com edições, exclusões e importações.

## Evidências

- Especificação: RN-07, D-06, RF-010, RF-061, RNF-03

## Perguntas em aberto

- Nenhuma.

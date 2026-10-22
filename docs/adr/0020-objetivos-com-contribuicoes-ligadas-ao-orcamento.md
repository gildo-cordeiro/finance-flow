# ADR-0020 — Objetivos com contribuições ligadas a transações e ao orçamento

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RF-070 a RF-074, entidades Goal e GoalContribution).

## Contexto

No projeto anterior, metas eram "envelopes virtuais": contribuições manuais que não criavam transações e ficavam fora do orçamento e do fluxo de caixa. A especificação pede contribuições automáticas vinculadas ao orçamento, com lançamento mensal previsto.

## Decisão

- Valor atual do objetivo = `initial_amount` + soma das contribuições; não é armazenado.
- Contribuição automática cria uma recorrência (ADR-0010) que gera transações `PLANNED`; cada contribuição aponta para a transação (`transaction_id`).
- Contribuição manual pode ou não ter transação ligada.
- Objetivos podem ser do usuário ou do casal (`couple_id`); a autoria de cada contribuição é registrada.

## Consequências

- Poupar para um objetivo aparece no orçamento e no fluxo de caixa, como a especificação pede.
- Excluir a transação de uma contribuição precisa refletir no objetivo.

## Alternativas consideradas

- Envelopes virtuais sem transação (projeto anterior): contraria RF-071.

## Evidências

- Especificação: RF-070 a RF-074, RF-083
- Projeto anterior: ADR antigo 0032 (substituído por este)

## Perguntas em aberto

- A contribuição é uma transferência para uma conta de poupança (`TRANSFER`) ou uma despesa em uma categoria de objetivos?

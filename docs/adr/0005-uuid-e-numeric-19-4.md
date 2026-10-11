# ADR-0005 — Identificadores UUID e valores monetários em NUMERIC(19,4)

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': Observada no schema e no código; o motivo não está documentado.

## Contexto

O modelo de dados do PDF (§4.4) lista `id` sem tipo e `amount`, `balance` etc. sem precisão. A escolha de tipos aparece apenas nas migrations.

## Decisão

Todas as chaves primárias são `UUID`. Valores monetários (`amount`, `balance`, `credit_limit`, `planned_amount`, `target_amount`, `current_amount`) são `NUMERIC(19,4)` no banco e `BigDecimal` no Java.

## Consequências

- IDs não sequenciais e geráveis fora do banco (`UUID.randomUUID()` nos use cases).
- Quatro casas decimais permitem cálculos intermediários sem perda; a interface exibe BRL com duas.

## Alternativas consideradas

Não documentadas.

## Evidências

- Migrations `V1` a `V11`
- `GoalRecalculationService` (soma com `BigDecimal`)

## Perguntas em aberto

- Motivação não documentada — confirmar com Gildo.
- Há planos de suportar mais de uma moeda?

# ADR-0026 — Parcelas e recorrências materializadas como transações

- Status: Aceito (retroativo)
- Data: 2026-06-27 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Confirmada no código; o motivo não está documentado.

## Contexto

O PDF (§4.4) prevê campos de parcelamento e recorrência na transação. O commit `c3045af` os implementou junto com ações em lote.

## Decisão

- Compra parcelada: `CreateTransactionUseCase` cria uma transação por parcela, com `installment_group_id`, `installment_number` e `total_installments`; a competência avança um mês por parcela.
- Recorrência: o sistema cria 12 ocorrências de uma vez, ligadas por `recurrence_group_id` (com `is_recurring` e `recurrence_rule`).
- Há ações em lote sobre transações.

## Consequências

- Projeções e orçamentos futuros enxergam as parcelas e as 12 ocorrências sem lógica especial.
- Não há job agendado: nenhuma anotação `@Scheduled` existe no backend. Uma recorrência acaba sozinha após 12 meses.

## Alternativas consideradas

Gerar ocorrências sob demanda (por job): não adotado.

## Evidências

- Commit `c3045af`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §4.4
- Migration `V6__add_installment_and_recurrence_fields_to_transactions.sql`
- `CreateTransactionUseCase.java` (`handleInstallmentCreation`, `handleRecurringCreation`)

## Perguntas em aberto

- O que deve acontecer com recorrências após 12 meses? Motivação do limite não documentada.

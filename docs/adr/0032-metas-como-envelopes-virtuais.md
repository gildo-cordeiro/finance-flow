# ADR-0032 — Metas como envelopes virtuais com contribuições manuais

- Status: Aceito (retroativo)
- Data: 2026-06-30 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Requisito no PDF (§2.8); modelo confirmado no schema e no código.

## Contexto

O PDF (§2.8) descreve objetivos financeiros com valor-alvo, prazo, contribuições e histórico, individuais ou do casal.

## Decisão

- Uma meta pertence a um usuário ou a um casal, nunca aos dois (`CHECK chk_goals_owner`).
- Contribuições manuais ficam em `goal_contributions`.
- `current_amount` é recalculado por `GoalRecalculationService` como a soma das contribuições; o status é `ACTIVE`, `COMPLETED` (alvo atingido) ou `ARCHIVED`.
- O módulo de metas não cria nem altera transações; as metas ficam fora do fluxo de caixa e do orçamento.

## Consequências

- Contribuir para uma meta não movimenta saldo de conta.
- O PDF também prevê contribuições automáticas vinculadas ao orçamento e projeção de atingimento, ainda não implementadas.

## Alternativas consideradas

Registrar contribuições como transações: não adotado.

## Evidências

- Commit `c5a53eb`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §2.8
- Migration `V11__create_goals_and_contributions.sql`
- `backend/.../goals/service/GoalRecalculationService.java`

## Perguntas em aberto

- Contribuições automáticas e projeção de atingimento continuam no roadmap?

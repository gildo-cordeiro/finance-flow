# ADR-0024 — Cartão de crédito associado a uma conta de pagamento

- Status: Aceito (retroativo)
- Data: 2026-06-26 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': Título do commit e schema; a lógica de saldo projetado não foi conferida em detalhe.

## Contexto

O PDF (§4.4) modela contas e cartões na mesma entidade `Account`, com `type` (`CHECKING`, `SAVINGS` ou `CREDIT_CARD`). O commit `e562473` separou contas de cartões e os associou 'para saldo projetado'.

## Decisão

A tabela `accounts` ganhou `associated_account_id` (FK opcional para outra conta, `ON DELETE SET NULL`). Cartões e contas aparecem separados na interface.

## Consequências

- O saldo projetado pode considerar a fatura do cartão contra a conta associada (segundo o título do commit).
- Excluir a conta associada não apaga o cartão; o vínculo é apenas anulado.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commit `e562473`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §4.4
- Migration `V5__associate_credit_cards_to_accounts.sql`

## Perguntas em aberto

- Como exatamente o saldo projetado usa essa associação? Detalhar após conferir `GetCashFlowUseCase`.

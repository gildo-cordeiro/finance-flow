# ADR-0033 — Ciclo de vida de contas: arquivar, encerrar e excluir com regras

- Status: Aceito (retroativo)
- Data: 2026-07-01 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Regras descritas no corpo do commit `d0dc44c`.

## Contexto

Contas precisavam poder sair de uso sem perder o histórico de transações.

## Decisão

Nova coluna `accounts.status` (`ACTIVE`, `ARCHIVED`, `CLOSED`, V12). Regras:
- Arquivar: bloqueado para cartão com transações `PENDING` ou `PLANNED`.
- Desarquivar: volta de `ARCHIVED` para `ACTIVE`.
- Encerrar: apenas contas bancárias com saldo zero.
- Excluir: apenas contas sem transações associadas.
- Endpoints `PUT`, `PATCH` (archive, unarchive, close) e `DELETE`.

## Consequências

- O histórico é preservado quando a conta é arquivada ou encerrada.
- Excluir só é possível para contas sem movimentação.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commit `d0dc44c`
- Migration `V12__add_status_to_accounts.sql`
- `backend/.../account/service/`

## Perguntas em aberto

- Nenhuma.

# ADR-0023 — Formulários com React Hook Form e Zod

- Status: Aceito (retroativo)
- Data: 2026-06-26 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': Observada no histórico e no código; o motivo não está documentado.

## Contexto

Os formulários do frontend eram controlados manualmente; o commit `0f455eb` os migrou.

## Decisão

Formulários usam `react-hook-form` com `zod` via `@hookform/resolvers`. Os schemas ficam em cada feature (por exemplo, `features/transactions/schemas/transactionSchema.ts`).

## Consequências

- Validação do lado do cliente centralizada em schemas.
- Inputs monetários com máscara exigiram ajustes de validação (`a8fc4cb`, `e8d4c9d`).

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `0f455eb`, `a8fc4cb`, `e8d4c9d`
- `frontend/package.json`
- `frontend/src/features/transactions/schemas/transactionSchema.ts`

## Perguntas em aberto

- Motivação não documentada — confirmar com Gildo.

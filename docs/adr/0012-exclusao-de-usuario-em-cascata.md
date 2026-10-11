# ADR-0012 — Exclusão de usuário propaga em cascata pelo schema

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': A exigência está no PDF (§6.4); a relação direta com o desenho do schema não está documentada.

## Contexto

O PDF (§6.4) exige que o usuário possa solicitar a exclusão completa da conta e dos dados.

## Decisão

As chaves estrangeiras que partem de `users` usam `ON DELETE CASCADE` (contas, transações, categorias, orçamentos, metas, contribuições, refresh tokens) e a V9 aplicou o mesmo aos vínculos de casal. Alguns vínculos usam `ON DELETE SET NULL` (`goals.couple_id`, `accounts.associated_account_id`). O frontend tem uma aba 'Zona de Perigo' (`DangerZoneTab`).

## Consequências

- Remover o usuário remove os dados dele sem etapas manuais.
- A exclusão é irreversível; não há soft delete de usuários.

## Alternativas consideradas

Não documentadas.

## Evidências

- Migrations `V1` a `V11`
- Migration `V9__add_cascade_delete_to_couples.sql`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §6.4
- `frontend/src/features/auth/components/settings/DangerZoneTab.tsx`

## Perguntas em aberto

- Existe endpoint de backend para exclusão de conta e exportação de dados (PDF §6.4)? Não verifiquei; a exportação não foi encontrada.

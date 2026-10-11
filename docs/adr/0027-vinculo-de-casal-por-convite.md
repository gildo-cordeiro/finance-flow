# ADR-0027 — Vínculo de casal por convite entre dois usuários

- Status: Aceito (retroativo)
- Data: 2026-06-27 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Requisito no PDF (§2.7); estrutura confirmada no código e no schema.

## Contexto

O PDF (§2.7) descreve o módulo de casal como extensão natural do sistema individual, sem recriar dados.

## Decisão

A tabela `couples` liga dois usuários (`user1_id`, `user2_id`) com `status` `PENDING`, `ACTIVE` ou `DISSOLVED` e um índice único para o par. O fluxo tem casos de uso de convidar, aceitar, recusar, consultar status e dissolver. As chaves estrangeiras usam `ON DELETE CASCADE` (V9).

## Consequências

- Metas e outras entidades podem pertencer ao casal (ADR-0032).
- A skill `couple-context` descreve colunas `user_a_id`/`user_b_id` e status `PENDING_INVITE`, mas o código e o schema usam `user1_id`/`user2_id` e `PENDING`.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commit `5b56d13`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §2.7 e §4.4
- Migrations `V7` e `V9`
- `backend/.../couple/`
- `.agents/skills/couple-context/SKILL.md`

## Perguntas em aberto

- Atualizar a skill `couple-context` para refletir os nomes reais?

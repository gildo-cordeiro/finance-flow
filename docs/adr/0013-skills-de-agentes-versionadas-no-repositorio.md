# ADR-0013 — Skills de agentes de IA versionadas no repositório

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': Observada nos commits; o motivo não está documentado.

## Contexto

O repositório nasceu já com instruções para assistentes de IA (commit `c082286`) e as ampliou ao longo do tempo (`40088b8`, `dd6341e`, `2d3ca81`).

## Decisão

As diretrizes para agentes ficam em `.agents/skills/<nome>/SKILL.md`, versionadas junto com o código: `financeflow-architecture`, `temporal-competence`, `couple-context`, `git-workflow`, `code-implementation`, `frontend-financeflow` e `full-stack-task`.

## Consequências

- As skills guiam o comportamento do agente e envelhecem quando o código muda; em 2026-10-10 foram corrigidas divergências sobre `develop`, Redis e Kafka (PR #84).
- Skills e `docs/design-system.md` repetem informações, o que cria risco de divergência.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `c082286`, `40088b8`, `dd6341e`, `2d3ca81`, `0984aaf`
- PR #84
- `.agents/skills/`

## Perguntas em aberto

- Qual é o processo para manter as skills sincronizadas com o código?

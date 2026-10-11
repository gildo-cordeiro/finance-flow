# ADR-0036 — Kafka fora da stack

- Status: Aceito (retroativo)
- Data: 2026-10-10 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Decisão do mantenedor, registrada no PR #84.

## Contexto

As skills do agente descreviam padrões de Kafka (`references/kafka-patterns.md`), mas não há dependência de Kafka no `build.gradle` nem serviço no `docker-compose.yml`. O risco era um agente gerar código de mensageria sem base.

## Decisão

Kafka não faz parte da stack. Todas as referências foram removidas das skills (arquivo de referência, link na skill `code-implementation` e menção em `design-patterns.md`).

## Consequências

- Qualquer mensageria assíncrona futura exige uma decisão registrada em novo ADR.
- O histórico do git preserva o conteúdo removido.

## Alternativas consideradas

Manter a referência marcada como 'apenas referência': aplicada por pouco tempo no mesmo PR e substituída pela remoção.

## Evidências

- Commits `00e2e00`, `21aa0d2`
- PR #84
- `backend/build.gradle`
- `docker-compose.yml`

## Perguntas em aberto

- Nenhuma.

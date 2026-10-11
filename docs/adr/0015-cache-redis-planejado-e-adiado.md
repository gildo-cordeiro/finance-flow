# ADR-0015 — Cache Redis (Upstash) planejado e ainda não implementado

- Status: Adiado (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': O plano está documentado no PDF (§4.2); o adiamento é observado pela ausência no código e não tem registro.

## Contexto

O PDF (§4.2) planeja Redis para cache de dashboards pesados e para rate limiting, com Upstash como hospedagem gratuita.

## Decisão

O `docker-compose.yml` sobe um serviço `redis:7-alpine`, mas o `build.gradle` não tem dependência de cache nem de Redis e nenhum código o usa. Até haver uma issue explícita, o cache é tratado como planejado.

## Consequências

- O README ainda lista 'Redis (Upstash)' na stack, o que passa a impressão de que existe.
- O rate limiting do login (ADR-0006) também depende dessa decisão.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commit `0fd9da7`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §4.2
- `docker-compose.yml`
- `backend/build.gradle`
- PR #84 (skills ajustadas)

## Perguntas em aberto

- O Redis continua no roadmap? Se não, retirar do README e do `docker-compose.yml`.

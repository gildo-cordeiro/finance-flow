# ADR-0020 — Estratégia de testes e verificações automáticas

- Status: Aceito (retroativo)
- Data: 2026-06-23 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': Observada no workflow, no build e no histórico; a meta de cobertura vem do PDF.

## Contexto

O PDF (requisitos não funcionais) pede cobertura mínima de 70% no backend. O CI foi criado em `208f32b` e ajustado em `7bc685b` para usar um Postgres de serviço.

## Decisão

- Backend: JUnit 5 com Spring Boot Test, `spring-security-test` e Testcontainers (`postgresql`); o CI roda `./gradlew test` com um serviço `postgres:15`. Há 42 arquivos de teste.
- Frontend: lint, `vitest run` e build no CI; hook `husky` de pre-push (`frontend/.husky/pre-push`) roda `npm run lint && npm run test`.
- O frontend tem um único teste (`dummy.test.ts`).

## Consequências

- A meta de 70% não é medida: não há JaCoCo nem limite configurado.
- O hook de pre-push só cobre o frontend.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commits `208f32b`, `7bc685b`, `913d742`, `3b583d5`
- `.github/workflows/tests.yml`
- `backend/build.gradle`
- `frontend/.husky/pre-push`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` (requisitos não funcionais)

## Perguntas em aberto

- A meta de 70% de cobertura continua valendo? Qual é a cobertura atual?

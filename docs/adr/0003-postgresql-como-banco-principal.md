# ADR-0003 — PostgreSQL como banco principal

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Documentada no PDF de requisitos (§8.3).

## Contexto

Dados financeiros são fortemente relacionais e exigem ACID (PDF §8.3). O PostgreSQL também oferece JSONB para dados semiestruturados, o que dispensa um banco NoSQL à parte.

## Decisão

PostgreSQL como único banco de dados. Desenvolvimento local com `postgres:16-alpine` no `docker-compose.yml`; CI com `postgres:15`. A hospedagem gerenciada recomendada é o Supabase (PDF §4.2, README); a conexão é configurada por `SPRING_DATASOURCE_URL`.

## Consequências

- Testes de integração rodam contra Postgres real (ver ADR-0020).
- Há versões diferentes entre o ambiente local (16) e o CI (15).

## Alternativas consideradas

Banco NoSQL: descartado no PDF §8.3.

## Evidências

- Commit `0fd9da7`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §4.2 e §8.3
- `docker-compose.yml`
- `.github/workflows/tests.yml`
- `backend/src/main/resources/application.properties`

## Perguntas em aberto

- A versão de produção do Postgres é a 15, a 16 ou outra? Vale alinhar o CI e o ambiente local à produção.

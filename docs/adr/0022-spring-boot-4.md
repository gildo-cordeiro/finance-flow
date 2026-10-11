# ADR-0022 — Atualização para Spring Boot 4.0.x

- Status: Aceito (retroativo)
- Data: 2026-06-26 (data do commit ou do artefato que introduziu a decisão)
- Confiança: média
- Origem do 'porquê': Observada no histórico; o motivo não está documentado. O PDF ainda cita Spring Boot 3.

## Contexto

O PDF e a decisão inicial (ADR-0002) previam Spring Boot 3. Em 2026-06-26 o projeto foi atualizado (`462d616`) e, no mesmo dia, outro commit ajustou a stack e o cálculo de competência (`e9704b5`).

## Decisão

O backend usa Spring Boot 4.0.7.

## Consequências

- O README já cita 4.0.7, mas o PDF de requisitos continua citando Spring Boot 3.
- Bibliotecas e APIs depreciadas precisaram de ajuste (por exemplo, `HttpStatus.UNPROCESSABLE_ENTITY`).

## Alternativas consideradas

Manter o Spring Boot 3: não documentado.

## Evidências

- Commits `462d616`, `e9704b5`
- `backend/build.gradle`
- `README.md`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §4.2 e §8.4

## Perguntas em aberto

- Motivação da atualização não documentada — confirmar com Gildo.

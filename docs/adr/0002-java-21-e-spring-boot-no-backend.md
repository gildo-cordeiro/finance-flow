# ADR-0002 — Java 21 e Spring Boot no backend

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Documentada no PDF de requisitos (§8.4).

## Contexto

O PDF (§8.4) justifica a escolha pelo fato de Java ser a linguagem principal do desenvolvedor (mais de 6 anos de experiência): usar a linguagem que se domina acelera o desenvolvimento e reduz o risco de decisões ruins por desconhecimento. O ecossistema Spring é descrito como robusto, seguro e bem documentado.

## Decisão

Backend em Java 21 com Spring Boot (Spring Security, Spring Data JPA/Hibernate, Actuator) e Gradle. Modelos de domínio como Java Records, sem Lombok. A versão efetiva do Spring Boot mudou depois (ver ADR-0022).

## Consequências

- Imagem Docker baseada em `eclipse-temurin:21`.
- Sem Lombok: mais código explícito, com Records para o domínio.

## Alternativas consideradas

Não documentadas.

## Evidências

- Commit `0fd9da7`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §4.2 e §8.4
- `backend/build.gradle`
- `backend/Dockerfile`

## Perguntas em aberto

- Nenhuma.

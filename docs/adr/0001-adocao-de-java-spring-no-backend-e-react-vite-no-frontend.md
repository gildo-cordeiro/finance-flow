# ADR-0001 — Adoção de Java 21 com Spring Boot e React 18 com Vite

- Status: Aceito (retroativo)
- Data: 2026-06-22
- Confiança: alta

## Contexto

Para o desenvolvimento do projeto FinanceFlow, era necessário definir a stack tecnológica base para o backend e frontend. O sistema precisaria de uma fundação robusta para manipulação de dados e regras de negócio complexas, ao mesmo tempo que demandava uma interface moderna, rápida e tipada. 

## Decisão

Foi decidido adotar Java 21 com Spring Boot 4.0.7 para o backend (fornecendo segurança e robustez corporativa através de um ecossistema maduro com JPA, Flyway e Security) e React 18 com Vite e TypeScript no frontend (visando performance de build e renderização ágil).

## Consequências

- Benefícios: Ecossistema consolidado no backend, tipagem estática robusta em ambas as pontas (Java e TypeScript) e tempo rápido de setup e compilação do frontend graças ao Vite.
- Desafios: A gestão da sincronia e configuração entre os ambientes foi delegada a um `docker-compose.yml` local para viabilizar bancos como Postgres e Redis no ambiente de desenvolvimento.

## Alternativas consideradas

- Não documentadas.

## Evidências

- Commits: `c082286`, `0fd9da7`
- Arquivos: `README.md`, `backend/build.gradle`, `frontend/package.json`, `docker-compose.yml`
- Issues e PRs: N/A

## Perguntas em aberto

- Nenhuma.

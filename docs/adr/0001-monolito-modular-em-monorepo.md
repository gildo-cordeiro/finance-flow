# ADR-0001 — Monólito modular em monorepo

- Status: Aceito (retroativo)
- Data: 2026-06-22 (data do commit ou do artefato que introduziu a decisão)
- Confiança: alta
- Origem do 'porquê': Documentada no PDF de requisitos (§8.1) e no README.

## Contexto

O sistema é pessoal e mantido por um único desenvolvedor. O PDF (§8.1) avalia que microsserviços adicionariam overhead de operação (vários deploys, service discovery, comunicação entre serviços) sem benefício real.

## Decisão

Um único backend Spring Boot, dividido em módulos de domínio por pacote (`auth`, `account`, `transaction`, `budget`, `cashflow`, `couple`, `goals`, `travel`, `shared` e, depois, `dashboard`), no mesmo repositório do frontend (`backend/` e `frontend/`), com `docker-compose.yml` na raiz.

## Consequências

- Um deploy por lado (backend e frontend), com menos complexidade operacional.
- As fronteiras entre módulos são só convenção de pacote; não encontrei verificação automática de dependências entre módulos.
- A extração futura de módulos para serviços continua possível (PDF §8.1).

## Alternativas consideradas

Microsserviços: rejeitados no PDF §8.1.

## Evidências

- Commits `c082286`, `0fd9da7`
- `docs/FinanceFlow_Requisitos_Arquitetura.pdf` §4.1 e §8.1
- `README.md` (seção 'Organização do Projeto')
- `backend/src/main/java/com/financeflow/`

## Perguntas em aberto

- Existe regra sobre quais módulos podem depender de quais? (hoje `goals` usa o repositório de `couple`, por exemplo.)

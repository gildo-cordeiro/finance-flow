# ADR-0006 — Adoção de Arquitetura Multi-Contexto Persistente para Casais

- Status: Aceito (retroativo)
- Data: 2026-06-27
- Confiança: alta

## Contexto

A fase 5 do projeto determinava a necessidade de compartilhamento de despesas, sem que as visões individuais perdessem sua autonomia. A exibição misturada de finanças individuais com finanças conjugais na mesma dashboard causaria confusão severa no cálculo de fluxos e orçamentos.

## Decisão

Foi desenvolvido um módulo ponta a ponta (backend/frontend) para Gestão de Casal, utilizando convites (por email/status). O frontend adotou um modelo de **Alternância de Contexto (ViewContext)** salvo via `localStorage`. A navegação permite chavear o sistema inteiro (API, cabeçalhos usando `X-View-Context`) entre o modo "Pessoal" e o consolidado "Casal". A transição exibe um indicativo visual premium global para alertar onde o usuário está navegando.

## Consequências

- Benefícios: Isolamento robusto (inclusive em relação à LGPD), preservando a autonomia financeira enquanto consolida dados instantaneamente na visão Casal.
- Desafios: Refatoração grande em repositórios (backend) para validar as regras do cabeçalho `X-View-Context` nas requisições, evitando vazamento de visibilidade.

## Alternativas consideradas

- Não documentadas.

## Evidências

- Commits: `5b56d13`
- Arquivos: `backend/src/main/resources/db/migration/V7__create_couples_table.sql`, `frontend/src/context/ViewContext.tsx`, `frontend/src/features/couple/api/couple.ts`
- Issues e PRs: PR #31

## Perguntas em aberto

- Nenhuma.
